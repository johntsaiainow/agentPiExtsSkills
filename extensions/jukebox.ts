import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// 音樂庫路徑
const MUSIC_DIR = path.resolve(process.env.HOME || "", "Music");
const SOCKET_PATH = "/tmp/mpv-jukebox.sock";

// 支援的音訊格式
const SUPPORTED_EXTENSIONS = [".flac", ".mp3", ".m4a", ".wav", ".ogg", ".aac", ".opus"];

let mpvProcess: any = null;

// 啟動 mpv 背景 IPC 服務
function ensureMpvRunning() {
  if (!mpvProcess || mpvProcess.killed) {
    if (fs.existsSync(SOCKET_PATH)) {
      try { fs.unlinkSync(SOCKET_PATH); } catch (e) {}
    }
    mpvProcess = spawn("mpv", [
      "--idle=yes",
      `--input-ipc-server=${SOCKET_PATH}`,
      "--no-video",
      "--no-audio-display"
    ], { stdio: "ignore", detached: true });
    
    mpvProcess.unref();
  }
}

// 發送 IPC 指令給 mpv（加入重試與輪詢機制，解決 ENOENT 競態問題）
async function sendMpvCommand(command: any[]): Promise<string> {
  const net = await import("net");
  ensureMpvRunning();

  const connectWithRetry = (retries = 30, delayMs = 100): Promise<any> => {
    return new Promise((resolve, reject) => {
      const attempt = (remaining: number) => {
        const client = net.createConnection({ path: SOCKET_PATH }, () => {
          resolve(client);
        });

        client.on("error", (err) => {
          client.destroy();
          if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), delayMs);
          } else {
            reject(err);
          }
        });
      };
      attempt(retries);
    });
  };

  const client = await connectWithRetry();

  return new Promise((resolve, reject) => {
    client.write(JSON.stringify({ command }) + "\n");

    client.on("data", (data: Buffer) => {
      client.end();
      resolve(data.toString());
    });

    client.on("error", (err: Error) => {
      reject(err);
    });
  });
}

// 遞迴搜尋音樂檔案
function findAudioFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(findAudioFiles(fullPath));
      } else {
        const ext = path.extname(file).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {}
  return results;
}

export default function registerJukebox(pi: any) {
  // 核心執行邏輯
  const executeCoreAction = async ({ action, query }: { action?: string; query?: string } = {}): Promise<string> => {
    try {
      if (!action) {
        return "Error: No action provided.";
      }

      if (action === "list") {
        const files = findAudioFiles(MUSIC_DIR);
        if (files.length === 0) {
          return `No supported audio files found in ${MUSIC_DIR}`;
        }
        return files.map(f => path.basename(f)).slice(0, 50).join("\n");
      }

      if (action === "search_and_play" || action === "play") {
        const files = findAudioFiles(MUSIC_DIR);
        if (files.length === 0) {
          return `No audio files found in ${MUSIC_DIR}`;
        }

        let target: string | undefined;

        if (query && query.trim()) {
          const q = query.trim().toLowerCase();
          const matches = files.filter(f => f.toLowerCase().includes(q));
          if (matches.length > 0) {
            target = matches[Math.floor(Math.random() * matches.length)];
          }
        } else if (action === "play") {
          target = files[Math.floor(Math.random() * files.length)];
        }

        if (!target) {
          return `No song found matching "${query || ""}" in ${MUSIC_DIR}`;
        }

        await sendMpvCommand(["loadfile", target, "replace"]);
        return `Now playing: ${path.basename(target)} (${path.relative(MUSIC_DIR, target)})`;
      }

      if (action === "pause") {
        await sendMpvCommand(["set_property", "pause", true]);
        return "Playback paused.";
      }

      if (action === "resume") {
        await sendMpvCommand(["set_property", "pause", false]);
        return "Playback resumed.";
      }

      if (action === "stop") {
        await sendMpvCommand(["stop"]);
        return "Playback stopped.";
      }

      return `Unknown action: ${action}`;
    } catch (err: any) {
      return `Jukebox Error: ${err.message}`;
    }
  };

  // 1. 註冊 Tool 給 LLM 使用
  pi.registerTool({
    name: "jukebox_control",
    description: "Control the local Jukebox: search, play, pause, resume, or list music tracks (FLAC, MP3). Note: Local files are in English, so translate Chinese artist/song names to English (e.g. translate '皇后樂團' to 'Queen', '披頭四' to 'Beatles') before searching.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["play", "search_and_play", "pause", "resume", "stop", "list"],
          description: "Action to perform on the jukebox"
        },
        query: {
          type: "string",
          description: "English artist, album, song title keyword, or filename to search and play"
        }
      },
      required: ["action"]
    },
    execute: async (...args: any[]) => {
      let action: string | undefined;
      let query: string | undefined;

      const searchForParams = (obj: any, depth = 0) => {
        if (!obj || typeof obj !== "object" || depth > 3) return;

        if (typeof obj.action === "string") {
          action = obj.action;
          if (typeof obj.query === "string") query = obj.query;
          return;
        }

        const candidates = ["parameters", "params", "input", "args", "arguments", "data"];
        for (const key of candidates) {
          if (obj[key] && typeof obj[key] === "object") {
            searchForParams(obj[key], depth + 1);
            if (action) return;
          }
        }

        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === "object" && obj[key] !== null) {
            searchForParams(obj[key], depth + 1);
            if (action) return;
          }
        }
      };

      for (const arg of args) {
        searchForParams(arg);
        if (action) break;
      }

      const text = await executeCoreAction({ action, query });
      return {
        content: [
          {
            type: "text",
            text
          }
        ]
      };
    }
  });

  // 2. 註冊 Slash Command: /juke
  pi.registerCommand("juke", {
    description: "Quick Jukebox control (e.g. /juke play Queen, /juke stop)",
    handler: async (args: string) => {
      const parts = (args || "").trim().split(/\s+/).filter(Boolean);
      const cmd = parts[0] || "list";
      const q = parts.slice(1).join(" ");
      return await executeCoreAction({ action: cmd, query: q });
    }
  });
}
