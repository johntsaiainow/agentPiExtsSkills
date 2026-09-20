# Agent Capabilities & Guidelines

## 1. Jukebox Control (Music Playback)
- You can manage local music playback via `jukebox_control`.
- The local music library filenames are in English. When the user requests songs or artists in Traditional Chinese (e.g. 皇后樂團), translate them to English (e.g. Queen) before querying.
- Actions: `list`, `play`, `search_and_play`, `pause`, `resume`, `stop`.

## 2. Camera Vision (YOLOv8 Headless)
- You can inspect the real world in front of the camera using `camera_vision`.
- When the user asks what is in front of the camera or asks to take a look, call `camera_vision` with `action: "snapshot"`.
- Summarize the detected objects and counts naturally in Traditional Chinese.
- Call `action: "stop"` when the user requests to turn off the camera.
