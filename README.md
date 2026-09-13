<div align="center">

# Airymax Desktop Client

> Personal client for the Airymax AI Agent Runtime Platform — a cross-platform
> desktop application built on Tauri v2 that maps the AgentRT backend core
> modules to a native graphical interface.

**Language:** English | [简体中文](README_zh.md)

Powered by OpenAirymax

[![License](https://img.shields.io/badge/license-AGPL--3.0+Apache--2.0-4a90d9)](LICENSE)
[![Branch](https://img.shields.io/badge/branch-main-6f42c1)](https://atomgit.com/openairymax/desktop)

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://atomgit.com/openairymax/desktop)

</div>

---

## Overview

The **Desktop Client** is the **personal client** of the Airymax product line.
It packages the AgentRT runtime, SDK and ecosystem capabilities into a single
installable desktop application so individual users can operate the platform
without touching a terminal or container orchestrator. It is one of the three
leaf repositories under the
[`products/`](https://atomgit.com/openairymax/products) management repo,
alongside `docker` (deployment image) and `memoryrovol` (commercial memory
provider).

The application is a cross-platform (Windows / macOS / Linux) native wrapper
built on **Tauri v2** (Rust 2021 edition core) with a **React 18 + TypeScript
5 + Vite 5** frontend. It supports offline-first PWA behaviour, system tray
integration, global shortcuts, and a built-in connection to a locally running
AgentRT gateway (default `http://localhost:8080`). The Rust core exposes IPC
commands to the frontend through a typed bridge, while the frontend mirrors
the AgentRT backend modules (kernel, daemons, gateway, OpenLab) into
tabbed graphical workspaces.

The Desktop Client targets personal users, developers and evaluators who need a
local graphical interface to the Airymax runtime. Distributable artifacts
include NSIS / MSI installers for Windows, DMG images for macOS, and DEB /
AppImage bundles for Linux.

## Directory Structure

```
desktop/
├── src/                       # React 18 + TypeScript frontend
│   ├── pages/                 # Top-level screens (Dashboard, AgentManagement,
│   │                          #   TaskManagement, MemoryEvolution,
│   │                          #   CognitiveLoop, ModelConfig, OpenLab,
│   │                          #   SecurityCenter, Telemetry, Settings, ...)
│   ├── components/            # Reusable UI (Layout, AIChat, AgentPanel,
│   │                          #   CommandPalette, GlobalSearch, MemorySystem,
│   │                          #   NotificationCenter, WelcomeWizard, ...)
│   ├── services/              # Frontend SDK & service layer
│   │   ├── agentos-sdk.ts     #   Gateway API client
│   │   ├── agentos.service.ts #   High-level service facade
│   │   └── tauri-bridge.ts    #   Rust ↔ JS bridge
│   ├── hooks/                 # React hooks (useAgentOS, useAnimations,
│   │                          #   useKeyboardShortcuts, ...)
│   ├── i18n/                  # i18next localization (en / zh)
│   ├── design-system/         # Shared design tokens
│   ├── constants/  types/  utils/  styles/
│   ├── App.tsx  main.tsx
│   └── setupTests.ts
├── src-tauri/                 # Tauri v2 (Rust) native shell
│   ├── src/                   # Rust entry & IPC commands
│   │   ├── main.rs  lib.rs    #   Entry + app builder
│   │   ├── commands.rs        #   Tauri command handlers
│   │   ├── backend_client.rs  #   Gateway HTTP client (reqwest)
│   │   ├── llm_client.rs      #   Direct LLM provider client
│   │   ├── cli.rs             #   CLI argument parsing
│   │   └── protocol_commands.rs
│   ├── icons/                 # Cross-platform icon set + icns / ico
│   ├── Cargo.toml             # crate `airymax-agentrt`
│   ├── Cargo.lock  build.rs
│   └── tauri.conf.json        # window / CSP / tray / bundle config
├── public/                    # Static assets + PWA manifest + service worker
├── e2e/                       # Playwright end-to-end tests
├── .github/                   # CI workflows + CODEOWNERS
├── .eslintrc.json  .prettierrc  tsconfig.json
├── vite.config.ts             # Vite + PWA + dev proxy to gateway
├── vitest.config.ts  playwright.config.ts
├── package.json               # npm manifest (name `airymax-agentos`)
├── .env.example               # gateway / Ollama defaults
├── INSTALLATION.md            # End-user install guide
├── LICENSE                    # AGPL-3.0 + Apache-2.0 dual text
├── NOTICE                     # Copyright & third-party notice
├── README.md                  # This file
└── README_zh.md               # 简体中文版
```

## Features / Components

The desktop client maps each workspace to the matching AgentRT backend
capability. The table below lists each workspace tab, the AgentRT component
behind it, and a short description.

| Module | AgentRT Backend | Description |
|--------|-----------------|-------------|
| Dashboard | Gateway status API | System overview, real-time status, quick actions |
| Agent Management | `daemons/agent_d` + `atoms/corekern` | Create / start / monitor / destroy AI agents |
| Task Management | `atoms/taskflow` | Submit, schedule, track and review tasks |
| Session Management | `daemons/agent_d` | Full lifecycle for the built-in agent types |
| AI Chat | `daemons/llm_d` + `daemons/think_d` | Multi-agent dialogue, context-aware suggestions |
| Skill Registry | Built-in skill / hook services | Skill registration with state management |
| Tool Manager | `daemons/tool_d` + `atoms/syscall` | Tool registration, execution & permissions |
| Model Config | `daemons/llm_d` | LLM providers, system params, env vars |
| Cognitive Loop | `atoms/coreloopthree` | 4-stage cognition visualisation, inference engine |
| Memory System | `atoms/memory/` (`builtin` + `memoryrovol` providers) | L1–L4 layered memory: retrieval, evolution, cleanup |
| OpenLab | `daemons/market_d` | Extension apps with search / install / rating |
| Service Gateway | `gateway/` + `daemons/gateway_d` | Backend health & latency monitoring |
| Security Center | Runtime policy & audit services | Security policies & audit logs |
| System Monitor | `daemons/monit_d` | Real-time performance & environment metrics |
| Telemetry | `daemons/monit_d` + `heapstore/` | System & business metrics, alerting |
| Logs Terminal | Runtime logging services | Log viewer + terminal emulator |
| Settings | Local configuration | Appearance, gateway, data & version info |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript 5 + Vite 5 |
| Native shell | Tauri v2 (Rust 2021 edition) |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Routing | React Router v6 |
| i18n | i18next + react-i18next |
| Charts | Recharts 2 |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest (unit) + Playwright (E2E) |

### Native Capabilities

- **System tray** — left-click toggles the window, right-click exposes
  show / hide / quit actions (`tauri.conf.json → app.trayIcon`).
- **Global shortcuts** — `Ctrl+K` global search, `Ctrl+1~0` page navigation,
  `Ctrl+Shift+[` / `Ctrl+Shift+]` history back / forward
  (`tauri-plugin-global-shortcut`).
- **Single instance** — `tauri-plugin-single-instance` enforces one running
  process on Windows / Linux (macOS relies on native activation).
- **Shell & dialog plugins** — open external links, file pickers, save dialogs.

## Upstream Dependencies

```
                         ┌──────────────────────┐
   agentrt/ ──────────▶  │  products/desktop    │
   (runtime + SDK)       │  (this repository)   │
                         └──────────────────────┘
                                  ▲
                                  │ optional
                                  └── products/docker (deployment image)
```

- **`agentrt/`** — the AgentRT runtime source tree exposes the gateway
  HTTP / WebSocket API consumed by the frontend at
  `VITE_AGENTOS_GATEWAY_HOST:PORT` (default `http://localhost:8080`). The
  TypeScript API client in `src/services/agentos-sdk.ts` implements this
  contract.
- **`products/docker`** — optional companion image used to launch the gateway
  side-by-side with the desktop client on a personal machine. Provides a
  one-command `docker compose up` backend.
- **Tauri v2 toolchain** — Rust ≥ 1.70, `@tauri-apps/cli` (already pinned in
  `devDependencies`) and platform system libraries (WebKit2GTK on Linux,
  WebKit on macOS, WebView2 on Windows).

## Downstream Consumers

- **End users (personal)** — install the produced `.exe` / `.msi` / `.dmg` /
  `.deb` / `.AppImage` artifacts directly. See
  [`INSTALLATION.md`](INSTALLATION.md) for per-platform install / uninstall
  instructions.
- **`products/docker` (`Dockerfile.desktop`)** — consumes the desktop frontend
  source to build a static web image (pure Vite build, no Tauri native shell)
  served by Nginx inside the Docker stack.
- **`products/` management repository** — pins this repository as a git
  submodule (fixed commit) for coordinated releases.

## Build / Installation

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) >= 1.70 (required by Tauri v2)
- Tauri CLI v2 (`npm i -D @tauri-apps/cli` is already in devDependencies)
- A running AgentRT gateway at `http://localhost:8080` (start it via the
  `products/docker` image or directly from the runtime sources)

#### Additional platform requirements

- **Windows**: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload)
- **Linux (Debian/Ubuntu)**:
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
    libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
  ```
- **macOS**: Xcode Command Line Tools

### Build from source

```bash
# 1. Clone
git clone https://atomgit.com/openairymax/desktop.git
cd desktop

# 2. Install JS dependencies
npm install

# 3. Configure the local gateway endpoint (defaults already point at localhost:8080)
cp .env.example .env

# 4. Development mode (launches Vite + Tauri native window)
npm run tauri dev

# 5. Production build (generates native installers)
npm run tauri build
```

### End-user install (prebuilt artifacts)

| Platform | Artifact | Path |
|----------|----------|------|
| Windows | NSIS installer (`.exe`) | `src-tauri/target/release/bundle/nsis/` |
| Windows | MSI installer (`.msi`) | `src-tauri/target/release/bundle/msi/` |
| macOS | DMG image (`.dmg`) | `src-tauri/target/release/bundle/dmg/` |
| Linux | DEB package (`.deb`) | `src-tauri/target/release/bundle/deb/` |
| Linux | AppImage (`.AppImage`) | `src-tauri/target/release/bundle/appimage/` |

See [`INSTALLATION.md`](INSTALLATION.md) for step-by-step install / uninstall
instructions per platform.

### Development commands

```bash
npm run dev            # Vite dev server only (no native shell)
npm run tauri dev      # Full Tauri dev mode
npm run tauri build    # Production build with native installers
npm run lint           # ESLint
npm run format         # Prettier
npm run typecheck      # tsc -b --noEmit
npm run check          # typecheck + lint + build
npm run test           # Vitest watch
npm run test:run       # Vitest one-shot
npm run test:coverage  # Vitest with v8 coverage
npm run test:e2e       # Playwright
npm run clean          # Remove dist/ and src-tauri/target/
```

### Branch Strategy

- This repository is distributed from the **`main`** branch; release tags are
  cut on `main`.
- The `products/` management repository pins this repository as a submodule
  at an exact commit for reproducible releases.

## License

This repository is dual-licensed to maximize compatibility for personal users
and downstream redistributors:

- **GNU Affero General Public License v3.0 or later** (AGPL-3.0-or-later)
- **Apache License, Version 2.0**

You may choose either license at your option. The full text of both licenses is
included in the [`LICENSE`](LICENSE) file. The SPDX expression is:

```
AGPL-3.0-or-later OR Apache-2.0
```

See [`NOTICE`](NOTICE) for copyright, trademark and third-party component
notices.

```
Repository:  https://atomgit.com/openairymax/desktop.git
Branch:      main
SPDX:        AGPL-3.0-or-later OR Apache-2.0
```

Copyright (c) 2025-2026 SPHARX Ltd. All Rights Reserved.
