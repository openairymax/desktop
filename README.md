<div align="center">

# Airymax Desktop Client

> Personal client for the Airymax AI Agent Runtime Platform — a cross-platform
> desktop application built with Tauri v2 that fully maps the AgentRT backend
> core modules to a graphical interface.

**Language:** English | [简体中文](README_zh.md)

Powered by OpenAirymax

[![Version](https://img.shields.io/badge/version-0.1.1-5a6b7e)](https://atomgit.com/openairymax/desktop/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0+Apache--2.0-4a90d9)](LICENSE)
[![Branch](https://img.shields.io/badge/branch-feature%2Fofficial--hubs--01-6f42c1)](https://atomgit.com/openairymax/desktop)

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://atomgit.com/openairymax/desktop)

</div>

---

## 1. Module Positioning

The **Desktop Client** is the **personal client** of the Airymax product line.
It packages the runtime, SDK and ecosystem capabilities into a single
installable desktop application so individual users can operate the platform
without touching a terminal or container orchestrator.

- **Role**: One of the three leaf repositories under the
  [`products/`](https://atomgit.com/openairymax/products) management repo,
  alongside `docker` (deployment image) and `memoryrovol` (commercial memory
  provider).
- **Audience**: Personal users, developers and evaluators who need a local
  graphical interface to the Airymax runtime.
- **Scope**: Cross-platform (Windows / macOS / Linux) native wrapper built on
  Tauri v2 (Rust core) with a React 18 + TypeScript + Vite frontend. Supports
  offline-first PWA behaviour, system tray integration, global shortcuts and a
  built-in connection to a locally running AgentRT gateway.

### Upstream / Downstream

```
                         ┌──────────────────────┐
   sdk/agentrt ───────▶  │  products/desktop    │  ───────▶  End Users
   (runtime + SDK)       │  (this repository)   │           (personal)
                         └──────────────────────┘
                                  ▲
                                  │ optional
                                  └── products/docker (deployment image)
```

- **Upstream**:
  - `sdk/agentrt` — AgentRT runtime & SDK exposes the gateway HTTP / WebSocket
    API consumed at `VITE_AGENTOS_GATEWAY_HOST:PORT` (default
    `http://localhost:18789`).
  - `products/docker` — optional companion image used to launch the gateway
    side-by-side with the desktop client.
- **Downstream**:
  - End users (personal users) who install the produced `.exe` / `.dmg` /
    `.deb` / `.AppImage` artifacts.

## 2. Directory Structure

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
│   │   ├── agentos-sdk.ts     #   Generated API client
│   │   ├── agentos.service.ts #   High-level service facade
│   │   └── tauri-bridge.ts    #   Rust ↔ JS bridge
│   ├── hooks/                 # React hooks
│   ├── i18n/                  # i18next localization
│   ├── design-system/         # Shared design tokens
│   ├── constants/  types/  utils/  styles/
│   ├── App.tsx  main.tsx
│   └── setupTests.ts
├── src-tauri/                 # Tauri v2 (Rust) native shell
│   ├── src/                   # Rust entry & IPC commands
│   ├── icons/
│   ├── Cargo.toml             # crate `airymax-agentos`
│   ├── Cargo.lock  build.rs
│   └── tauri.conf.json        # window / CSP / tray / bundle config
├── public/                    # Static assets + PWA manifest + service worker
├── e2e/                       # Playwright end-to-end tests
├── .github/                   # CI workflows
├── .eslintrc.json  .prettierrc  tsconfig.json
├── vite.config.ts             # Vite + PWA + dev proxy to gateway
├── vitest.config.ts  playwright.config.ts
├── package.json               # version 0.1.1, name airymax-agentos
├── .env.example               # gateway / Ollama defaults
├── INSTALLATION.md            # End-user install guide
├── LICENSE                    # AGPL-3.0 + Apache-2.0 dual text
├── NOTICE                     # Copyright & third-party notice
├── README.md                  # This file
└── README_zh.md               # 简体中文版
```

## 3. Feature Map

The desktop client mirrors the AgentRT backend modules:

| Module | Mapped Backend | Description |
|--------|----------------|-------------|
| Dashboard | Aggregated status | System overview, real-time status, quick actions |
| Agent Management | `toolkit/agent` + `manager/kernel` | Create / start / monitor / destroy AI agents |
| Task Management | `atoms/taskflow` | Submit, schedule, track and review tasks |
| Session Management | `manager/session/` + `toolkit/session` | Full lifecycle for 6 agent types |
| AI Chat | `agents/` + `gateway/` | Multi-agent dialogue, context-aware suggestions |
| Skill Registry | `manager/skill/registry.yaml` | 7 skill categories with state management |
| Tool Manager | `manager/tools/` + `toolkit/syscall` | Tool registration, execution & permissions |
| Model Config | `manager/model/` + `manager/environment` | LLM providers, system params, env vars |
| Cognitive Loop | `atoms/coreloopthree` | 4-stage cognition visualisation, inference engine |
| Memory System | `atoms/memoryrovol` | L1-L4 layered memory: retrieval, evolution, cleanup |
| OpenLab | `openlab/` | 6 extension apps with search / install / rating |
| Service Gateway | `gateway/` | Backend health & latency monitoring |
| Security Center | `manager/security/` + `manager/sanitizer/` | 4 policy classes & audit logs |
| System Monitor | `manager/monitoring/` | Real-time performance & environment metrics |
| Telemetry | `toolkit/telemetry` + dashboards | 4 system + 4 business KPIs, alerting |
| Logs Terminal | `manager/logging/` | Log viewer + terminal emulator |
| Settings | `manager/schema/` + `manager/environment/` | Appearance, gateway, data & version info |

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript 5.4 + Vite 5 |
| Native shell | Tauri v2 (Rust 2021 edition) |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Routing | React Router v6 |
| i18n | i18next + react-i18next |
| Charts | Recharts 2 |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest (unit) + Playwright (E2E) |

## 5. Installation & Usage

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) >= 1.70 (required by Tauri v2)
- Tauri CLI v2 (`npm i -D @tauri-apps/cli` is already in devDependencies)
- A running AgentRT gateway at `http://localhost:18789` (start it via the
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
# 1. Clone (leaf repos live on the feature/official-hubs-01 branch)
git clone -b feature/official-hubs-01 git@atomgit.com:openairymax/desktop.git
cd desktop

# 2. Install JS dependencies
npm install

# 3. Configure the local gateway endpoint (defaults already point at localhost:18789)
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

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Global search |
| `Ctrl+1~0` | Quick page navigation |
| `Ctrl+Shift+[` | History back |
| `Ctrl+Shift+]` | History forward |

### System Tray

- **Left click**: show / hide window
- **Right click menu**: show window / hide to tray / quit

## 6. Development Commands

```bash
npm run dev            # Vite dev server only (no native shell)
npm run tauri dev      # Full Tauri dev mode
npm run tauri build    # Production build with native installers
npm run lint           # ESLint
npm run format         # Prettier
npm run typecheck      # tsc --noEmit
npm run check          # typecheck + lint + build
npm run test           # Vitest watch
npm run test:run       # Vitest one-shot
npm run test:coverage  # Vitest with v8 coverage
npm run test:e2e       # Playwright
npm run clean          # Remove dist/ and src-tauri/target/
```

## 7. Branch Strategy

- Leaf repository active development branch: **`feature/official-hubs-01`**
- Management repo (`products/`) tracks the same branch via git submodule pointer.

## 8. Related Repositories

| Repository | Link | Role |
|------------|------|------|
| Airymax Hub (umbrella) | [atomgit.com/openairymax/airymaxhub](https://atomgit.com/openairymax/airymaxhub) | Top-level management repo |
| Products (parent) | [atomgit.com/openairymax/products](https://atomgit.com/openairymax/products) | Packaging & distribution layer |
| AgentRT Runtime / SDK | `sdk/agentrt` (within hub) | Upstream runtime |
| Docker Deployment | [atomgit.com/openairymax/docker](https://atomgit.com/openairymax/docker) | Sibling deployment image |
| MemoryRovol (commercial) | [atomgit.com/spharx/memoryrovol](https://atomgit.com/spharx/memoryrovol) | Commercial memory provider |
| **Desktop Client (this repo)** | [atomgit.com/openairymax/desktop](https://atomgit.com/openairymax/desktop) | Personal client |

## 9. License

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

Copyright (c) 2025-2026 **SPHARX Ltd.** All Rights Reserved.
