# Agent PI Extensions & Skills

A collection of **extensions, skills, and supporting tools for Agent PI**, focused on local-first AI, physical-world interaction, automation, and system integration.

> **Give the agent tools, not just words.**

The project extends Agent PI beyond conversation by giving the agent access to local applications, media, cameras, sensors, hardware, and system services.

---

## Overview

Agent PI Extensions & Skills explores a simple idea:

**An AI agent should be able to interact with the computer — and the physical world around it.**

The project combines two complementary concepts:

### Extensions

Extensions provide executable capabilities.

They allow Agent PI to interact with software, operating-system services, media, cameras, sensors, hardware, and external systems.

### Skills

Skills provide knowledge and behavior.

They teach the agent how and when to use available capabilities, including workflows, tool selection, and domain-specific behavior.

In short:

```text
Extensions → What the agent CAN do
Skills     → What the agent KNOWS how to do
```

---

## Current Capabilities

### 1. Local Jukebox

Local music playback and control using `mpv`.

Agent PI can:

* Search the local music library
* Play songs and artists
* Pause and resume playback
* Stop playback
* Accept natural-language music requests
* Translate non-English artist names before searching

Example:

```text
Play some Queen.
```

or:

```text
/juke play Queen
```

---

### 2. Camera Vision

Headless computer vision using **YOLOv8**.

Agent PI can inspect the physical environment through a connected camera and report detected objects.

Example:

```text
What do you see in front of the camera?
```

Conceptually:

```text
Camera
   │
   ▼
YOLOv8
   │
   ▼
Object Detection
   │
   ▼
Agent PI
   │
   ▼
Natural-language description
```

This provides a foundation for agents that can observe and react to the physical world rather than operating entirely inside a text interface.

---

### 3. Hardware Temperature Monitor

Physical temperature sensing using a **Digispark (ATtiny85)** and **DS18B20** digital temperature sensor.

The sensor module connects to the host through USB CDC virtual serial and provides real-time ambient temperature data to Agent PI.

Agent PI can:

* Read ambient temperature from physical hardware
* Access the sensor through `/dev/ttyACM0`
* Report temperature conversationally
* Use temperature as environmental context for agent workflows

The Digispark firmware uses non-blocking DigiCDC / V-USB polling to maintain USB communication while performing 1-Wire temperature conversions.

The capability is exposed to Agent PI through:

```text
get_room_temperature
```

Example:

```text
What's the room temperature?
```

Conceptually:

```text
DS18B20
   │
   │ 1-Wire
   ▼
ATtiny85 / Digispark
   │
   │ USB CDC
   ▼
Linux Host
   │
   ▼
get_room_temperature
   │
   ▼
Agent PI
```

This extends Agent PI from **seeing** the physical environment to also **sensing** it.

---

## Architecture

```text
                         User
                          │
                          ▼
                   ┌──────────────┐
                   │   Agent PI   │
                   └──────┬───────┘
                          │
               ┌──────────┴──────────┐
               │                     │
               ▼                     ▼
          Extensions              Skills
               │                     │
        Executable Tools       Agent Behavior
               │
       ┌───────┼─────────┐
       │       │         │
       ▼       ▼         ▼
    Jukebox  Vision  Temperature
       │       │         │
       ▼       ▼         ▼
      mpv    YOLOv8    USB CDC
       │       │         │
       ▼       ▼         ▼
   Speakers  Camera    ATtiny85
                         │
                         ▼
                       DS18B20
```

The architecture is intentionally modular.

New capabilities can be added without turning Agent PI itself into a monolithic application.

---

## Repository Structure

```text
agentPiExtsSkills/
├── extensions/        # Agent PI extensions
├── scripts/           # Supporting tools and runtime scripts
├── AGENTS.md          # Agent capabilities and behavior
├── package.json       # Project metadata
└── README.md          # Project overview
```

As the project grows, detailed technical documentation will be maintained separately under `docs/`.

---

## Quick Start

Clone the repository:

```bash
git clone https://github.com/johntsaiainow/agentPiExtsSkills.git
cd agentPiExtsSkills
```

Individual extensions may require additional software, hardware, or Python/Node.js dependencies.

For example:

```text
Jukebox       → mpv
Camera Vision → Python + YOLOv8
Temperature   → Digispark + DS18B20 + USB CDC
```

See the documentation for each extension before deployment.

---

## Agent Capabilities

`AGENTS.md` defines how Agent PI should use the capabilities provided by this repository.

Current capabilities include functions such as:

```text
jukebox_control
camera_vision
get_room_temperature
```

This separation keeps implementation and agent behavior independent:

```text
Hardware / Software
        │
        ▼
     Extension
        │
        ▼
    Agent Tool
        │
        ▼
 AGENTS.md / Skills
        │
        ▼
  Agent Behavior
```

---

## Design Philosophy

### Local First

Prefer local applications, models, services, sensors, and hardware whenever practical.

### Physical AI

Agents should be able to observe, sense, and eventually interact with the physical world — not only generate text.

### Modular

Capabilities should remain independent, composable, and replaceable.

### Agent Accessible

Useful system and hardware functions should be exposed as tools that an agent can reason about and invoke.

### Human Accessible

Agent automation should complement normal human control rather than replace it.

### Terminal Friendly

The project favors transparent, scriptable interfaces that work naturally with Linux and command-line workflows.

---

## Direction

This project is evolving toward a collection of reusable capabilities for local AI agents.

Potential areas include:

* Local media control
* Computer vision
* Environmental sensing
* Linux system administration
* Local LLM integration
* MCP integration
* RAG and local knowledge
* GPIO and hardware control
* IoT devices
* Network management
* Robotics
* Additional sensor integration
* Home and lab automation
* Embedded systems
* Reusable agent workflows

The long-term direction is an Agent PI environment capable of moving naturally between:

```text
Language
   ↓
Reasoning
   ↓
Tools
   ↓
Computer
   ↓
Sensors
   ↓
Physical World
```

---

## Documentation

The root README is intentionally kept as a high-level overview.

Detailed documentation for extensions, skills, hardware interfaces, protocols, installation, configuration, and development should live under:

```text
docs/
```

as the project grows.

---

## Contributing

Experiments and contributions are welcome.

New capabilities should aim to be:

* Modular
* Local-first where practical
* Scriptable
* Documented
* Useful to both agents and humans

---

## License

MIT

## Author

**John Tsai**

GitHub: `johntsaiainow`

---

> **Give the agent tools, not just words.**
>
> Then give it eyes, ears, sensors, and a path into the physical world.

