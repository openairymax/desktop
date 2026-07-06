<div align="center">

# Airymax 桌面客户端

> Airymax AI 智能体运行时平台的个人客户端 —— 基于 Tauri v2 构建的跨平台
> 桌面应用，将 AgentRT 后端核心模块能力完整映射到原生图形界面。

**语言:** [English](README.md) | 简体中文

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

## 概述

**桌面客户端**是 Airymax 产品线的**个人客户端**。它将 AgentRT 运行时、SDK 与生态能力打包为
一个可安装的桌面应用，让个人用户无需接触终端或容器编排器即可操作整个平台。它是
[`products/`](https://atomgit.com/openairymax/products) 管理仓下三个叶子仓之一，
另两个为 `docker`（部署镜像）和 `memoryrovol`（商业记忆提供者）。

应用基于 **Tauri v2**（Rust 2021 edition 内核）构建的跨平台（Windows / macOS / Linux）
原生外壳，前端采用 **React 18 + TypeScript 5.4 + Vite 5**。支持离线优先 PWA、系统托盘集成、
全局快捷键，并内置连接到本地运行的 AgentRT 网关（默认 `http://localhost:18789`）。
Rust 内核通过类型化桥向前端暴露 IPC 命令，前端则将 AgentRT 后端模块
（kernel、manager、agents、gateway、OpenLab）映射为分页式图形工作区。

桌面客户端面向需要本地图形界面操作 Airymax 运行时的个人用户、开发者与评估者。
可分发制品包括 Windows 的 NSIS / MSI 安装包、macOS 的 DMG 镜像，以及 Linux 的
DEB / AppImage 包。

## 目录结构

```
desktop/
├── src/                       # React 18 + TypeScript 前端
│   ├── pages/                 # 顶层页面（Dashboard、AgentManagement、
│   │                          #   TaskManagement、MemoryEvolution、
│   │                          #   CognitiveLoop、ModelConfig、OpenLab、
│   │                          #   SecurityCenter、Telemetry、Settings 等）
│   ├── components/            # 可复用 UI（Layout、AIChat、AgentPanel、
│   │                          #   CommandPalette、GlobalSearch、MemorySystem、
│   │                          #   NotificationCenter、WelcomeWizard 等）
│   ├── services/              # 前端 SDK 与服务层
│   │   ├── agentos-sdk.ts     #   生成的 API 客户端
│   │   ├── agentos.service.ts #   高层服务门面
│   │   └── tauri-bridge.ts    #   Rust ↔ JS 桥
│   ├── hooks/                 # React hooks（useAgentOS、useAnimations 等）
│   ├── i18n/                  # i18next 国际化（en / zh）
│   ├── design-system/         # 共享设计令牌
│   ├── constants/  types/  utils/  styles/
│   ├── App.tsx  main.tsx
│   └── setupTests.ts
├── src-tauri/                 # Tauri v2（Rust）原生外壳
│   ├── src/                   # Rust 入口与 IPC 命令
│   │   ├── main.rs  lib.rs    #   入口 + app builder
│   │   ├── commands.rs        #   Tauri 命令处理器
│   │   ├── backend_client.rs  #   网关 HTTP 客户端（reqwest）
│   │   ├── llm_client.rs      #   直连 LLM 提供商客户端
│   │   ├── cli.rs             #   CLI 参数解析
│   │   └── protocol_commands.rs
│   ├── icons/                 # 跨平台图标集 + icns / ico
│   ├── Cargo.toml             # crate `airymax-agentos`
│   ├── Cargo.lock  build.rs
│   └── tauri.conf.json        # 窗口 / CSP / 托盘 / 打包配置
├── public/                    # 静态资源 + PWA 清单 + Service Worker
├── e2e/                       # Playwright 端到端测试
├── .github/                   # CI 工作流 + CODEOWNERS
├── .eslintrc.json  .prettierrc  tsconfig.json
├── vite.config.ts             # Vite + PWA + 网关开发代理
├── vitest.config.ts  playwright.config.ts
├── package.json               # 版本 0.1.1，名称 airymax-agentos
├── .env.example               # 网关 / Ollama 默认值
├── INSTALLATION.md            # 终端用户安装指南
├── LICENSE                    # AGPL-3.0 + Apache-2.0 双许可证全文
├── NOTICE                     # 版权与第三方声明
├── README.md                  # 英文版
└── README_zh.md               # 本文件
```

## 功能 / 组件

桌面客户端与 AgentRT 后端模块一一对应。下表将每个工作区标签页映射到上游后端及简要说明。

| 模块 | 对应后端 | 功能描述 |
|------|----------|----------|
| 仪表盘 | 综合状态总览 | 系统概览、实时状态、快速操作入口 |
| 智能体管理 | `toolkit/agent` + `manager/kernel` | 创建 / 启动 / 监控 / 销毁 AI 智能体 |
| 任务管理 | `atoms/taskflow` | 任务提交、调度、跟踪与结果查看 |
| 会话管理 | `manager/session/` + `toolkit/session` | 6 种智能体类型的全生命周期管理 |
| AI 对话 | `agents/` + `gateway/` | 多智能体对话、上下文感知、建议提示 |
| 技能注册 | `manager/skill/registry.yaml` | 7 类技能注册与状态管理 |
| 工具管理 | `manager/tools/` + `toolkit/syscall` | 工具注册、执行和权限控制 |
| 模型配置 | `manager/model/` + `manager/environment` | LLM 提供商、系统参数、环境变量 |
| 认知循环 | `atoms/coreloopthree` | 4 阶段认知可视化、推理引擎选择 |
| 记忆系统 | `atoms/memoryrovol` | L1-L4 多层记忆：检索、演化、清理 |
| 应用市场 | `openlab/` | 6 个扩展应用、搜索 / 安装 / 评分 |
| 服务网关 | `gateway/` | 后端服务健康与延迟监控 |
| 安全中心 | `manager/security/` + `manager/sanitizer/` | 4 类安全策略与审计日志 |
| 系统监控 | `manager/monitoring/` | 实时性能与环境指标 |
| 遥测仪表盘 | `toolkit/telemetry` + dashboards | 4 系统 + 4 业务指标、告警 |
| 日志终端 | `manager/logging/` | 日志查看与终端模拟器 |
| 系统设置 | `manager/schema/` + `manager/environment/` | 外观、网关、数据与版本信息 |

### 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript 5.4 + Vite 5 |
| 原生外壳 | Tauri v2（Rust 2021 edition） |
| 动画 | Framer Motion 12 |
| 图标 | Lucide React |
| 路由 | React Router v6 |
| 国际化 | i18next + react-i18next |
| 图表 | Recharts 2 |
| PWA | vite-plugin-pwa + Workbox |
| 测试 | Vitest（单元）+ Playwright（E2E） |

### 原生能力

- **系统托盘** —— 左键切换窗口显示，右键暴露显示 / 隐藏 / 退出菜单
  （`tauri.conf.json → app.trayIcon`）。
- **全局快捷键** —— `Ctrl+K` 全局搜索、`Ctrl+1~0` 页面快速导航、
  `Ctrl+Shift+[` / `Ctrl+Shift+]` 历史后退 / 前进。
- **单实例** —— `tauri-plugin-single-instance` 在 Windows / Linux 上强制只运行一个进程
  （macOS 依赖系统原生激活）。
- **Shell 与对话框插件** —— 打开外部链接、文件选择器、保存对话框。

## 上游依赖

```
                         ┌──────────────────────┐
   sdk/agentrt ───────▶  │  products/desktop    │
   （运行时 + SDK）       │  （本仓库）          │
                         └──────────────────────┘
                                  ▲
                                  │ 可选
                                  └── products/docker（部署镜像）
```

- **`sdk/agentrt`** —— AgentRT 运行时与 SDK，提供网关 HTTP / WebSocket API，
  由前端通过 `VITE_AGENTOS_GATEWAY_HOST:PORT`（默认 `http://localhost:18789`）消费。
  `src/services/agentos-sdk.ts` 中的 TypeScript API 客户端基于此契约生成。
- **`products/docker`** —— 可选的配套镜像，用于在个人机器上与桌面客户端并行启动网关。
  提供一条 `docker compose up` 命令即可启动后端。
- **Tauri v2 工具链** —— Rust ≥ 1.70、`@tauri-apps/cli`（已在 devDependencies 中固定版本）
  以及各平台系统库（Linux 的 WebKit2GTK、macOS 的 WebKit、Windows 的 WebView2）。

## 下游消费者

- **终端用户（个人）** —— 直接安装产出的 `.exe` / `.msi` / `.dmg` / `.deb` / `.AppImage`
  制品。各平台逐步安装 / 卸载说明详见 [`INSTALLATION.md`](INSTALLATION.md)。
- **`products/docker`（`Dockerfile.desktop`）** —— 消费桌面前端源码以构建静态 Web 镜像
  （纯 Vite 构建，不含 Tauri 原生外壳），由 Nginx 在 Docker 栈中服务。
- **Airymax Hub 伞仓** —— 在 `feature/official-hubs-01` 分支上将本叶子仓作为 git 子模块固定，
  用于协同发布。

## 构建 / 安装

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) >= 1.70（Tauri v2 必需）
- Tauri CLI v2（已在 devDependencies 中通过 `npm i -D @tauri-apps/cli` 提供）
- 在 `http://localhost:18789` 运行的 AgentRT 网关（可通过 `products/docker` 镜像
  或直接从运行时源码启动）

#### 各平台额外依赖

- **Windows**：[Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（C++ 工作负载）
- **Linux（Debian/Ubuntu）**：
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
    libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
  ```
- **macOS**：Xcode Command Line Tools

### 从源码构建

```bash
# 1. 克隆（叶子仓位于 feature/official-hubs-01 分支）
git clone -b feature/official-hubs-01 git@atomgit.com:openairymax/desktop.git
cd desktop

# 2. 安装 JS 依赖
npm install

# 3. 配置本地网关端点（默认已指向 localhost:18789）
cp .env.example .env

# 4. 开发模式（启动 Vite + Tauri 原生窗口）
npm run tauri dev

# 5. 生产构建（生成原生安装包）
npm run tauri build
```

### 终端用户安装（预构建制品）

| 平台 | 制品 | 路径 |
|------|------|------|
| Windows | NSIS 安装包（`.exe`） | `src-tauri/target/release/bundle/nsis/` |
| Windows | MSI 安装包（`.msi`） | `src-tauri/target/release/bundle/msi/` |
| macOS | DMG 镜像（`.dmg`） | `src-tauri/target/release/bundle/dmg/` |
| Linux | DEB 包（`.deb`） | `src-tauri/target/release/bundle/deb/` |
| Linux | AppImage（`.AppImage`） | `src-tauri/target/release/bundle/appimage/` |

各平台逐步安装 / 卸载说明详见 [`INSTALLATION.md`](INSTALLATION.md)。

### 开发命令

```bash
npm run dev            # 仅 Vite 开发服务器（不含原生外壳）
npm run tauri dev      # 完整 Tauri 开发模式
npm run tauri build    # 生产构建，产出原生安装包
npm run lint           # ESLint
npm run format         # Prettier
npm run typecheck      # tsc --noEmit
npm run check          # 类型检查 + lint + 构建
npm run test           # Vitest watch
npm run test:run       # Vitest 一次性运行
npm run test:coverage  # Vitest + v8 覆盖率
npm run test:e2e       # Playwright
npm run clean          # 清理 dist/ 与 src-tauri/target/
```

### 分支策略

- 叶子仓活跃开发分支：**`feature/official-hubs-01`**
- 管理仓（`products/`）通过 git 子模块指针跟踪同一分支。

## 许可证

本仓库采用双许可证，最大化个人用户与下游再分发者的兼容性：

- **GNU Affero General Public License v3.0 or later**（AGPL-3.0-or-later）
- **Apache License, Version 2.0**

可任选其一适用。两份许可证的完整文本均见 [`LICENSE`](LICENSE) 文件。SPDX 表达式为：

```
AGPL-3.0-or-later OR Apache-2.0
```

版权、商标与第三方组件声明详见 [`NOTICE`](NOTICE)。

```
仓库:    git@atomgit.com:openairymax/desktop.git
分支:    feature/official-hubs-01
SPDX:    AGPL-3.0-or-later OR Apache-2.0
```

Copyright (c) 2025-2026 SPHARX Ltd. All Rights Reserved.
