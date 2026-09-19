# agentPiExtsSkills

> Agent PI Extensions and Skills Collections

A curated collection of custom extensions, skills, and tools designed to enhance **Agent PI**'s capabilities, ranging from local media control to automated workflows.

---

## 📁 Repository Structure

```text
agentPiExtsSkills/
├── extensions/       # Custom TypeScript/JavaScript extensions for Agent PI
│   └── jukebox.ts   # Local media playback control using mpv IPC
├── skills/           # Modular prompts, tool definitions, and skill wrappers
├── docs/             # Guides, API references, and documentation
└── package.json      # Dependencies and build configuration
🎵 Featured Extensions1. Jukebox (extensions/jukebox.ts)A local music player extension that connects Agent PI to mpv via IPC sockets. It allows both natural language interactions via LLM tools and direct CLI control using Slash Commands.   FeaturesSupported Audio Formats: .flac, .mp3, .m4a, .wav, .ogg, .aac, .opus   Language Translation Handling: Instructs the LLM to convert non-English artist/song queries into English before searching.   Robust IPC Connection: Built-in socket retries and background mpv process management.   Slash Command Interface: Quick manual control with /juke.   PrerequisitesEnsure mpv is installed on your system:macOS:Bashbrew install mpv
Ubuntu/Debian:Bashsudo apt install mpv
Usage1. Slash Commands/juke list - List available audio files   /juke play Queen - Search and play songs matching "Queen"   /juke pause - Pause current playback   /juke resume - Resume playback   /juke stop - Stop playback   2. Natural Language (LLM Tool)"Play some Beatles songs from my local library.""Pause the music.""Find and play some FLAC tracks."🚀 Getting StartedInstallationClone this repository:Bashgit clone [https://github.com/YOUR_USERNAME/agentPiExtsSkills.git](https://github.com/YOUR_USERNAME/agentPiExtsSkills.git)
cd agentPiExtsSkills
Install dependencies:Bashnpm install
Registering Extensions with Agent PI:Import or load the desired extensions (e.g., extensions/jukebox.ts) into your Agent PI runtime instance.🛠️ DevelopmentTo add new extensions or skills to this repository:Place new extensions inside extensions/ or modular skills in skills/.Follow the standard Agent PI registration interface (pi.registerTool and pi.registerCommand).   Update this README.md with relevant usage details.📝 LicenseMIT
