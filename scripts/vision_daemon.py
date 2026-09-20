import sys
import os
import json
import socket
import signal
import cv2
from collections import Counter
from ultralytics import YOLO

SOCKET_PATH = "/tmp/yolo-vision.sock"

# 載入模型（預設使用輕量化 yolov8n.pt）
model = YOLO("yolov8n.pt")

# 清理舊的 Socket 檔
if os.path.exists(SOCKET_PATH):
    try:
        os.unlink(SOCKET_PATH)
    except OSError:
        pass

# 常駐開啟相機鏡頭
device_id = int(sys.argv[1]) if len(sys.argv) > 1 else 0
cap = cv2.VideoCapture(device_id)

if not cap.isOpened():
    print(f"ERROR: Cannot open camera device {device_id}", flush=True)
    sys.exit(1)

# 建立 Unix Domain Socket 服務
server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
server.bind(SOCKET_PATH)
server.listen(1)

def cleanup(*args):
    cap.release()
    if os.path.exists(SOCKET_PATH):
        try:
            os.unlink(SOCKET_PATH)
        except OSError:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

print("VISION_READY", flush=True)

while True:
    conn, _ = server.accept()
    try:
        data = conn.recv(1024).decode("utf-8").strip()
        if data == "capture":
            # 讀取最新畫面（連續讀取清除 buffer，確保取得最新一幀）
            for _ in range(2):
                ret, frame = cap.read()
            
            if not ret:
                conn.sendall(json.dumps({"error": "Failed to grab frame from camera"}).encode("utf-8"))
            else:
                # 執行 YOLO 辨識
                results = model(frame, conf=0.45, verbose=False)
                
                detections = []
                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0].item())
                        name = r.names[cls_id]
                        conf = float(box.conf[0].item())
                        detections.append({"label": name, "confidence": round(conf, 2)})
                
                # 統計數量摘要
                counts = dict(Counter([d["label"] for d in detections]))
                response = {
                    "status": "ok",
                    "counts": counts,
                    "items": detections
                }
                conn.sendall(json.dumps(response, ensure_ascii=False).encode("utf-8"))
        elif data == "stop":
            conn.sendall(b"OK")
            break
    except Exception as e:
        conn.sendall(json.dumps({"error": str(e)}).encode("utf-8"))
    finally:
        conn.close()

cleanup()
