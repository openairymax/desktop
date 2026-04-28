# Airymax AgentOS

[![Stars](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.gitcode.com%2Fapi%2Fv5%2Frepos%2Fopenairymax%2Fdesktop&query=%24.stars_count&label=Stars&color=brightgreen&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEyIDIgMTUuMDkgOC4yNiAyMiA5LjI3IDE3IDE0LjE0IDE4LjE4IDIxLjAyIDEyIDE3Ljc3IDUuODIgMjEuMDIgNyAxNC4xNCAyIDkuMjcgOC45MSA4LjI2IDEyIDIiLz48L3N2Zz4%3D)](https://atomgit.com/openairymax/desktop)
[![Version](https://img.shields.io/badge/版本-0.0.4-blue)](https://atomgit.com/openairymax/desktop/releases)
[![Platform](https://img.shields.io/badge/平台-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://atomgit.com/openairymax/desktop)
[![License](https://img.shields.io/badge/许可证-MIT-green)](https://atomgit.com/openairymax/desktop)

基于 Tauri v2 构建的跨平台桌面应用，提供完整的 AI 智能体操作系统管理功能，全面映射 AgentOS 后端核心模块能力。

## 功能特性

### 核心功能
| 模块 | 对应 AgentOS 后端 | 功能描述 |
|------|-------------------|----------|
| **仪表盘** | 综合状态总览 | 系统概览、实时状态、快速操作入口 |
| **智能体管理** | toolkit/agent + manager/kernel | AI 智能体的创建、启动、监控和销毁 |
| **任务管理** | atoms/taskflow | 任务提交、调度、进度跟踪和结果查看 |
| **会话管理** | manager/session/ + toolkit/session | 全生命周期会话管理，支持 6 种智能体类型 |
| **AI 助手** | agents/ + gateway/ | 多智能体对话、上下文感知、建议提示 |
| **技能注册** | manager/skill/registry.yaml | 7 类技能注册与状态管理 |
| **工具管理** | manager/tools/ + toolkit/syscall | 工具注册、执行和权限控制 |

### AI 能力
| 模块 | 对应 AgentOS 后端 | 功能描述 |
|------|-------------------|----------|
| **模型配置** | manager/model/ + manager/environment | LLM 提供商配置、系统参数、环境变量 |
| **认知循环** | atoms/coreloopthree | 4 阶段认知过程可视化、推理引擎选择 |
| **记忆系统** | atoms/memoryrovol | L1-L4 多层记忆架构、检索、演化和清理 |
| **应用市场** | openlab/ | 6 个扩展应用、搜索/安装/评分系统 |

### 系统工具
| 模块 | 对应 AgentOS 后端 | 功能描述 |
|------|-------------------|----------|
| **服务网关** | gateway/ | 后端服务健康监控、延迟检测 |
| **安全中心** | manager/security/ + manager/sanitizer/ | 4 类安全策略管理、审计日志查看 |
| **系统监控** | manager/monitoring/ | 实时系统性能指标、环境信息 |
| **遥测仪表盘** | toolkit/telemetry + manager/monitoring/dashboards | 4 大系统指标、4 大业务指标、警报管理 |
| **日志终端** | manager/logging/ | 日志查看与终端模拟器集成 |
| **系统设置** | manager/schema/ + manager/environment/ | 外观、网关、数据管理和版本信息 |

## 技术栈

| 层次 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite 5.4 |
| **桌面引擎** | Tauri v2 (Rust) |
| **动画** | Framer Motion 12 |
| **图标** | Lucide React |
| **路由** | React Router v6 |
| **构建工具** | Vite 5.4 + tauri-cli 2 |

## 快速开始

### 前提条件
- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) (安装 Tauri v2 所需)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows 所需)

### 安装与运行

```bash
# 克隆仓库
git clone https://atomgit.com/openairymax/desktop.git
cd desktop

# 安装依赖
npm install

# 启动开发模式
npm run tauri dev

# 生产构建
npm run tauri build
```

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 全局搜索 |
| `Ctrl+1~0` | 快速导航页面 |
| `Ctrl+Shift+[` | 历史后退 |
| `Ctrl+Shift+]` | 历史前进 |

## 系统托盘

- **左键单击**: 显示/隐藏窗口
- **右键菜单**: 显示窗口 / 隐藏到托盘 / 退出

## 构建产物

| 平台 | 安装包格式 | 路径 |
|------|-----------|------|
| **Windows** | NSIS 安装包 (.exe) | `src-tauri/target/release/bundle/nsis/` |
| **Windows** | MSI 安装包 (.msi) | `src-tauri/target/release/bundle/msi/` |
| **macOS** | DMG 镜像 (.dmg) | `src-tauri/target/release/bundle/dmg/` |
| **Linux** | DEB 包 (.deb) | `src-tauri/target/release/bundle/deb/` |

## 发布历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.0.4 | 2026-04 | 完善所有页面和功能，新增遥测/应用市场/安全中心 |
| v0.0.3 | 2026-04 | 会话管理、技能注册、品牌升级 |
| v0.0.2 | 2026-04 | Tauri v2 构建、页面重写、离线优先 |
| v0.0.1 | 2026-04 | 初始版本 |

## 许可证

[MIT](LICENSE) © 2026 Airymax Team
