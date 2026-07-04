<div align="center">

# Airymax AgentOS Desktop Client

Powered by OpenAirymax

> A cross-platform desktop application built with Tauri v2, fully mapping AgentOS backend core module capabilities

[中文](README_zh.md) | English

[![AtomGit](https://atomgit.com/openairymax/desktop/star/badge.svg)](https://atomgit.com/openairymax/desktop)
 
[![Version](https://img.shields.io/badge/version-0.0.4-5a6b7e)](https://atomgit.com/openairymax/desktop/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0+Apache--2.0-4a90d9)](LICENSE)

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://atomgit.com/openairymax/desktop)

</div>

---

## Related Repositories

| Repository | Link |
|------------|------|
| AgentOS Core Source | [atomgit.com/openairymax/agentos](https://atomgit.com/openairymax/agentos) |
| Documentation | [atomgit.com/openairymax/docs](https://atomgit.com/openairymax/docs) |
| Docker Deployment | [atomgit.com/openairymax/docker](https://atomgit.com/openairymax/docker) |
| **Desktop Client (Current)** | [atomgit.com/openairymax/desktop](https://atomgit.com/openairymax/desktop) |

## 功能特性

- **仪表盘** - 系统概览与快速操作
- **智能体管理** - AI 智能体的创建、启动和监控
- **任务管理** - 任务提交与进度跟踪
- **AI 对话** - 与 AI 助手进行交互
- **模型配置** - LLM 提供商与参数设置
- **认知循环** - 观察 AI 思考过程
- **记忆进化** - 多层记忆系统管理
- **工具管理** - 工具注册与执行
- **服务管理** - 后端服务健康监控
- **系统监控** - 实时系统性能指标
- **日志终端** - 日志查看与终端集成
- **系统设置** - 应用配置管理

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **桌面引擎**: Tauri v2 (Rust)
- **动画**: Framer Motion
- **图标**: Lucide React

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 生产构建
npm run tauri build
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 全局搜索 |
| `Ctrl+1~0` | 快速导航页面 |
| `Ctrl+Shift+[/]` | 历史前进/后退 |

## 系统托盘

- 左键单击：显示/隐藏窗口
- 右键菜单：显示窗口 / 隐藏到托盘 / 退出

## 构建产物

- Windows: `src-tauri/target/release/bundle/nsis/*.exe`
- macOS: `src-tauri/target/release/bundle/dmg/*.dmg`
- Linux: `src-tauri/target/release/bundle/deb/*.deb`

## 版本

v0.0.4
