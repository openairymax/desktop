# Airymax AgentOS

[![Stars](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.gitcode.com%2Fapi%2Fv5%2Frepos%2Fopenairymax%2Fdesktop&query=%24.stars_count&label=Stars&color=brightgreen&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEyIDIgMTUuMDkgOC4yNiAyMiA5LjI3IDE3IDE0LjE0IDE4LjE4IDIxLjAyIDEyIDE3Ljc3IDUuODIgMjEuMDIgNyAxNC4xNCAyIDkuMjcgOC45MSA4LjI2IDEyIDIiLz48L3N2Zz4%3D)](https://atomgit.com/openairymax/desktop)
[![Version](https://img.shields.io/badge/version-0.0.4-blue)](https://atomgit.com/openairymax/desktop/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://atomgit.com/openairymax/desktop)
[![License](https://img.shields.io/badge/license-MIT-green)](https://atomgit.com/openairymax/desktop)

> 中文文档请查看 [README_zh.md](README_zh.md)

基于 Tauri v2 构建的跨平台桌面应用，提供完整的 AI 智能体管理功能。

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
