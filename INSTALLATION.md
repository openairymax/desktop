# Airymax AgentOS 安装指南

## 系统要求

### Windows
- Windows 10 1903+ 或 Windows 11
- x64 架构
- 最低 4GB 内存，推荐 8GB+

### macOS
- macOS 12.0 (Monterey) 或更高版本
- Intel 或 Apple Silicon

### Linux
- Ubuntu 22.04+ / Debian 12+ / Fedora 38+
- glibc 2.31+

## 下载安装

### Windows
1. 下载 `Airymax AgentOS_0.0.3_x64-setup.exe`
2. 双击运行安装向导
3. 从开始菜单启动应用

### macOS
1. 下载 DMG 文件
2. 拖拽到 Applications 文件夹
3. 首次启动若提示无法验证开发者，前往 系统偏好设置 > 安全性与隐私 > 仍要打开

### Linux
```bash
# DEB 包
sudo dpkg -i airymax-agentos_0.0.3_amd64.deb
sudo apt-get install -f

# AppImage
chmod +x Airymax-AgentOS_0.0.3_x86_64.AppImage
./Airymax-AgentOS_0.0.3_x86_64.AppImage
```

## 从源码构建

```bash
# 1. 安装依赖
npm install

# 2. 生成图标（首次构建需要）
npx tauri icon <源图标路径>

# 3. 开发模式
npm run tauri dev

# 4. 生产构建
npm run tauri build
```

## 前置要求

- Node.js >= 18.x
- Rust >= 1.70
- Tauri CLI v2

### Windows 额外依赖
- Visual Studio Build Tools (C++ 开发环境)

### Linux 额外依赖
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl \
  wget file libssl-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev
```

## 卸载

### Windows
控制面板 > 程序和功能 > Airymax AgentOS > 卸载

### macOS
将应用从 Applications 拖到废纸篓

### Linux
```bash
sudo dpkg --remove airymax-agentos
```

## 支持

- 问题反馈：https://atomgit.com/spharx/spharxworks/issues
