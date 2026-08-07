# 高德星际·星际客运 · 打包部署指南

本应用为 Web 应用（React + Vite），同时提供 **Electron**（macOS DMG / Windows / Linux）与 **Capacitor**（Android APK / iOS）打包配置，用户可自行构建。

## 前置条件

```bash
# 安装依赖
pnpm install

# 构建前端产物（dist/）
pnpm build
```

---

## 一、Electron 桌面端打包（DMG / exe / AppImage）

### 1. 安装 Electron 相关依赖

```bash
pnpm add -D electron electron-builder
```

### 2. macOS DMG 打包

```bash
# 构建前端
pnpm build

# 打包（生成 release/ 目录下的 .dmg）
npx electron-builder --mac
```

输出：`release/高德星际·星际客运-x.x.x-arm64.dmg` 与 `release/高德星际·星际客运-x.x.x-x64.dmg`

### 3. Windows exe 打包

```bash
npx electron-builder --win
```

### 4. Linux AppImage 打包

```bash
npx electron-builder --linux
```

### 5. 开发调试

```bash
# 终端1：启动 Vite dev server
pnpm dev

# 终端2：启动 Electron（会加载 localhost:5173）
npx electron electron/main.js
```

### 配置文件

- `electron-builder.json` — 打包配置（图标、目标平台、签名等）
- `electron/main.js` — 主进程入口
- `electron/preload.js` — 预加载脚本（安全桥接）

### 图标准备

将应用图标放入 `electron/build/`：
- `icon.icns`（macOS）
- `icon.ico`（Windows）
- `icon.png`（Linux，建议 512×512）

可从一张 1024×1024 的 PNG 使用 `electron-icon-builder` 生成全部格式。

---

## 二、Capacitor 移动端打包（APK / IPA）

### 1. 安装 Capacitor 依赖

```bash
pnpm add @capacitor/core @capacitor/cli
pnpm add @capacitor/android @capacitor/ios
pnpm add @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
```

### 2. 构建前端并同步到原生项目

```bash
# 构建前端
pnpm build

# 添加原生平台（首次）
npx cap add android
npx cap add ios   # 仅 macOS 可执行

# 同步 Web 资源到原生项目
npx cap sync
```

### 3. Android APK 打包

#### 方式 A：使用 Android Studio（推荐）

```bash
npx cap open android
```

在 Android Studio 中：
1. 等待 Gradle 同步完成
2. 菜单 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
3. APK 输出：`android/app/build/outputs/apk/debug/app-debug.apk`

#### 方式 B：命令行

```bash
cd android
./gradlew assembleDebug
# 输出：app/build/outputs/apk/debug/app-debug.apk

# Release 包（需签名）
./gradlew assembleRelease
```

#### 生成签名密钥（Release 用）

```bash
keytool -genkey -v -keystore interstellar.keystore -alias interstellar \
  -keyalg RSA -keysize 2048 -validity 10000
```

### 4. iOS 打包（需 macOS + Xcode）

```bash
npx cap open ios
```

在 Xcode 中配置签名后 `Product → Archive`。

### 配置文件

- `capacitor.config.ts` — Capacitor 配置（appId、应用名、插件等）

### 应用 ID

- Android: `com.miaoda.gaode.interstellar`
- iOS: `com.miaoda.gaode.interstellar`

---

## 三、环境变量

在项目根目录创建 `.env` 文件（构建时会被 Vite 注入）：

```env
VITE_SUPABASE_URL=https://backend.appmiaoda.com/projects/supabase343615473771921408
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 四、常用命令速查

| 操作 | 命令 |
|------|------|
| 开发调试 | `pnpm dev` |
| 代码检查 | `pnpm lint` |
| 构建 Web | `pnpm build` |
| Electron 开发 | `npx electron electron/main.js` |
| 打包 DMG | `npx electron-builder --mac` |
| 打包 Windows | `npx electron-builder --win` |
| 添加 Android | `npx cap add android` |
| 同步原生 | `npx cap sync` |
| 打开 Android Studio | `npx cap open android` |
| 构建 APK | `cd android && ./gradlew assembleDebug` |
