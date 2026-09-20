import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";

const SCRIPT_PATH = path.resolve(
  process.env.HOME || "",
  ".pi/agent/scripts/vision_daemon.py"
);
const SOCKET_PATH = "/tmp/yolo-vision.sock";

let visionProcess: ChildProcess | null = null;

// 自動尋找適用的 Python 虛擬環境
function resolvePythonBinary(): string {
  const isWindows = process.platform === "win32";
  const binDir = isWindows ? "Scripts" : "bin";
  const exeName = isWindows ? "python.exe" : "python";

  const candidatePaths = [
    // 1. 終端機目前已啟動的環境變數
    process.env.VIRTUAL_ENV ? path.join(process.env.VIRTUAL_ENV, binDir, exeName) : null,
    // 2. 當前工作目錄下的虛擬環境
    path.resolve(process.cwd(), ".venv", binDir, exeName),
    path.resolve(process.cwd(), "venv", binDir, exeName),
    // 3. Pi Agent 專屬虛擬環境
    path.resolve(process.env.HOME || "", ".pi/agent/venv", binDir, exeName)
  ];

  for (const candidate of candidatePaths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return "python3";
}

// 啟動常駐背景視覺程序
function ensureVisionRunning(deviceId = 0): Promise<void> {
  return new Promise((resolve) => {
    if (visionProcess && !visionProcess.killed && fs.existsSync(SOCKET_PATH)) {
      return resolve();
    }

    // 啟動前若有殘留的 Socket 先行清理
    if (fs.existsSync(SOCKET_PATH)) {
      try {
        fs.unlinkSync(SOCKET_PATH);
      } catch (e) {}
    }

    const pythonBin = resolvePythonBinary();
    visionProcess = spawn(pythonBin, [SCRIPT_PATH, String(deviceId)], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false
    });

    visionProcess.stderr?.on("data", (data: Buffer) => {
      console.error(`[YOLO Vision Daemon Error] ${data.toString()}`);
    });

    visionProcess.on("exit", () => {
      visionProcess = null;
    });

    resolve();
  });
}

// 發送 Socket 指令（具備輪詢與自動重試，徹底根除 ENOENT）
function sendSocketMessage(cmd: string, retries = 30, delayMs = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const attempt = (remaining: number) => {
      const client = net.createConnection({ path: SOCKET_PATH }, () => {
        client.write(cmd);
      });

      let buffer = "";

      client.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
      });

      client.on("end", () => {
        resolve(buffer);
      });

      client.on("error", (err: any) => {
        client.destroy();
        // 若 Socket 還未建立且仍有重試次數，則等待後繼續嘗試
        if ((err.code === "ENOENT" || err.code === "ECONNREFUSED") && remaining > 0) {
          setTimeout(() => attempt(remaining - 1), delayMs);
        } else {
          reject(err);
        }
      });
    };

    attempt(retries);
  });
}

// 擷取即時辨識結果
async function captureVision(deviceId = 0): Promise<string> {
  try {
    await ensureVisionRunning(deviceId);
    const response = await sendSocketMessage("capture");
    return response;
  } catch (err: any) {
    return JSON.stringify({ error: `鏡頭連線失敗: ${err.message}` });
  }
}

// 關閉常駐鏡頭
async function stopVision(): Promise<string> {
  if (fs.existsSync(SOCKET_PATH)) {
    try {
      await sendSocketMessage("stop", 5, 100);
    } catch (e) {}
  }

  if (visionProcess) {
    visionProcess.kill("SIGTERM");
    visionProcess = null;
  }

  if (fs.existsSync(SOCKET_PATH)) {
    try {
      fs.unlinkSync(SOCKET_PATH);
    } catch (e) {}
  }

  return "相機已停止，硬體資源已釋放。";
}

export default function registerYoloExtension(pi: any) {
  const executeAction = async ({
    action,
    device_id
  }: {
    action?: string;
    device_id?: number;
  } = {}) => {
    switch (action) {
      case "start":
        await ensureVisionRunning(device_id ?? 0);
        return "相機已啟動並在背景待命。";
      case "snapshot":
      case "look":
        return await captureVision(device_id ?? 0);
      case "stop":
        return await stopVision();
      case "status":
        return visionProcess && fs.existsSync(SOCKET_PATH)
          ? "相機常駐運作中，隨時可拍照辨識。"
          : "相機目前處於關閉狀態。";
      default:
        return "未知動作。支援動作：snapshot, start, stop, status";
    }
  };

  // 1. 註冊 Tool 給 LLM 使用
  pi.registerTool({
    name: "camera_vision",
    description:
      "Use the webcam to inspect and see what is currently in front of the camera. Returns JSON results detailing detected objects and counts.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["snapshot", "start", "stop", "status"],
          description:
            "'snapshot' to capture and see the current scene, 'start' to initialize camera, 'stop' to release camera, 'status' to check."
        },
        device_id: {
          type: "integer",
          description: "Camera device index (default: 0)"
        }
      },
      required: ["action"]
    },
    execute: async (...args: any[]) => {
      let action: string | undefined;
      let device_id: number | undefined;

      const parseParams = (obj: any, depth = 0) => {
        if (!obj || typeof obj !== "object" || depth > 3) return;
        if (typeof obj.action === "string") {
          action = obj.action;
          if (typeof obj.device_id === "number") device_id = obj.device_id;
          return;
        }
        for (const k of Object.keys(obj)) {
          if (typeof obj[k] === "object" && obj[k] !== null) {
            parseParams(obj[k], depth + 1);
            if (action) return;
          }
        }
      };

      for (const arg of args) {
        parseParams(arg);
        if (action) break;
      }

      const text = await executeAction({ action, device_id });
      return { content: [{ type: "text", text }] };
    }
  });

  // 2. 註冊 Slash Command: /look
  pi.registerCommand("look", {
    description: "Snapshot and inspect what the camera sees right now",
    handler: async () => {
      return await executeAction({ action: "snapshot" });
    }
  });
}
