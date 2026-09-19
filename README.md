# Agent PI Extensions & Skills

A collection of **extensions, skills, and tools for Agent PI**, focused on local-first automation, system integration, and agent-driven workflows.

The goal of this project is simple:

> **Give the agent tools, not just words.**

Agent PI can use these components to interact with local applications, services, hardware, and other systems while keeping functionality modular and reusable.

---

## Overview

This repository contains two main types of components:

### Extensions

Extensions add executable capabilities to Agent PI.

They can expose tools to the agent, provide user-facing commands, and integrate with local software or services.

Examples include:

* Media control
* Linux system management
* Hardware interfaces
* IoT control
* Local services
* External APIs

### Skills

Skills provide reusable agent knowledge and workflows.

They can define:

* Instructions
* Specialized behavior
* Tool usage
* Automation workflows
* Domain-specific knowledge
* Integration procedures

Extensions provide the **capability**.

Skills teach the agent **how and when to use it**.

---

## Repository Structure

```text id="dy2wmp"
agentPiExtsSkills/
├── extensions/        # Agent PI extensions
├── skills/            # Agent skills
├── docs/              # Documentation
├── package.json
└── README.md
```

---

## Featured Extension

### Jukebox

The Jukebox extension provides local music playback and control through `mpv`.

It supports both natural-language interaction and direct `/juke` commands.

Examples:

```text id="9o5oqp"
Play some Beatles.
```

```text id="sp3w36"
/juke play Queen
```

```text id="c0c20q"
/juke pause
```

The extension communicates with `mpv` through IPC and allows Agent PI to search and control a local audio library.

See the documentation for configuration and usage details.

---

## Quick Start

Clone the repository:

```bash id="wxrryw"
git clone https://github.com/johntsaiainow/agentPiExtsSkills.git
cd agentPiExtsSkills
```

Install dependencies:

```bash id="yjgxsd"
npm install
```

Individual extensions and skills may have additional dependencies.

See the corresponding documentation before installation.

---

## Documentation

Detailed documentation lives under [`docs/`](docs/).

Topics include:

```text id="9d67fv"
docs/
├── extensions.md
├── skills.md
├── architecture.md
└── development.md
```

Extension-specific and skill-specific documentation may also be provided alongside their implementations.

---

## Design Philosophy

### Local First

Prefer local applications, services, models, and hardware whenever practical.

### Modular

Extensions and skills should remain independent, composable, and reusable.

### Agent Accessible

System capabilities should be exposed in a way that an agent can reason about and invoke.

### Human Accessible

Important functionality should remain directly controllable by the user.

### Terminal Friendly

Agent automation should complement normal command-line workflows rather than hide them.

---

## Roadmap

Future components may include:

* Linux system administration
* Local LLM integration
* MCP integrations
* RAG and local knowledge systems
* Hardware and GPIO control
* IoT automation
* Network management
* Additional media tools
* Reusable agent workflows

---

## Contributing

Contributions and experiments are welcome.

New components should remain modular, document their dependencies, and include practical usage examples.

See [`docs/development.md`](docs/development.md) for development guidelines.

---

## License

MIT

## Author

**John Tsai**

GitHub: `johntsaiainow`

---

> **Give the agent tools, not just words.**

