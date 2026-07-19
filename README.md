# 陪伴自习室规划阅读页

项目包含完整产品规划源文档和一个无需构建、无需第三方依赖的 HTML 阅读页。

## 使用

直接打开 `index.html`，或在项目根目录启动任意静态文件服务器。

```bash
python3 server.py --port 8080
```

访问 `http://localhost:8080`。运行结构测试：

```bash
node --test tests/site.test.mjs
python3 -m unittest tests/test_server.py
```

使用 `server.py` 而不是 Python 默认静态服务器，会将 Markdown 作为明确声明 UTF-8 的纯文本返回，避免部分浏览器错误猜测中文编码。

## 桌面软件视觉预览

```bash
npm install
npm run preview:dev
npm run preview:test -- --run
npm run preview:build
```

当前单人自习 MVP 已支持真实番茄钟、程序化白噪音、本地记录、摄像头预览、低频监督抽帧和自习报告。摄像头默认关闭，画面不会写入浏览器存储或服务器文件。

## 接入 AI 问答和视觉模型

前端只连接项目自带的同源代理，API 密钥不会进入浏览器代码。复制 `.env.example` 中的配置到运行环境：

```bash
export AI_BASE_URL=http://127.0.0.1:11434/v1
export AI_TEXT_MODEL=qwen2.5:7b
export AI_VISION_MODEL=qwen2.5vl:7b
export VITE_AI_API_URL=/api/ai
npm run preview:build
python3 server.py --port 52341
```

`AI_BASE_URL` 接受 OpenAI-compatible 的 `/v1` 地址，可指向在线服务、Ollama 或 vLLM。在线服务还需设置 `AI_API_KEY`。未在构建时设置 `VITE_AI_API_URL` 时，应用保持本地演示模式，绝不会发起模型请求。

代理接口：

- `POST /api/ai/chat`：JSON `{ "question": "..." }`
- `POST /api/ai/vision`：JSON `{ "image": "data:image/jpeg;base64,..." }`

生产环境必须通过 HTTPS 提供页面，否则公网浏览器会禁止摄像头权限。

## 桌面应用与移动端

桌面版基于 Electron，默认启用上下文隔离并关闭渲染进程的 Node 权限。开发运行和生成安装目录：

```bash
npm run desktop:dev
npm run desktop:pack
```

生成的应用位于 `release/`。执行 `npm run desktop:dist` 可按当前操作系统生成安装包；Windows 构建目标为 NSIS，Linux 为 AppImage。

Web 版本同时包含 PWA manifest 和离线缓存，可在支持的移动浏览器中“添加到主屏幕”。移动端摄像头同样要求 HTTPS，后台计时能力受手机系统的节电策略影响。

## 桌面自动更新

已安装的桌面版会在启动后自动检查并下载稳定版更新。Windows 下载完成后提示“立即重启更新”或“稍后”，不会直接打断正在进行的自习。

默认更新源是公开的 GitHub Releases。推送 `v*` 版本标签会触发安装包、blockmap 和更新元数据构建，并创建 Release。版本号必须先在 `package.json` 中递增，标签需与版本一致，例如 `v0.2.0`。

也可以为自建 HTTPS 静态更新服务器构建相同产物：

```bash
export COMPANION_UPDATE_URL=https://updates.example.com/companion-study-room
npm run desktop:dist:generic
```

将 `release/` 中的安装包、`.blockmap`、`latest.yml`、`latest-mac-arm64.json` 与 `latest-mac-x64.json` 原样上传到该 URL。两个 macOS JSON 清单由构建脚本生成，包含对应 DMG 的 SHA-512；更新服务器必须公开可读且使用 HTTPS，客户端不保存 GitHub token 或服务器凭据。

当前 macOS 构建没有 Developer ID 与 Apple 公证凭据，因此下载完成后会提示用户打开 DMG 并手动覆盖安装，不执行静默应用内安装。取得证书后应启用稳定签名和公证，再验收应用内重启安装流程。

### Windows 安装方式

Windows Release 同时提供 `setup` 安装版和 `portable` 便携版。安装版会显示安装向导：

- “仅为我安装”默认使用 `%LOCALAPPDATA%\Programs\伴读`，通常不需要管理员权限。
- “为所有用户安装”默认使用 `%ProgramFiles%\伴读`，Windows 会请求管理员权限。
- 两种模式都可以在目录页面修改安装位置。

Portable EXE 无需安装，不创建卸载项。它不会自动下载或覆盖自身；检测到新版时只提示用户前往 GitHub Release 下载。

## 桌面设置中心

桌面版右上角设置中心支持：

- 适配不同窗口高度并保持主自习界面无滚动。
- 三种官方陪伴形象、系统音色和 AI 回复自动朗读。
- 导入不超过 12 MB 的本地背景图片，以及不超过 40 MB 的本地白噪音/音乐。
- 分别配置问答、视觉监督和 TTS 服务；预置 OpenAI、DeepSeek、硅基流动、Ollama 与自定义 OpenAI-compatible 服务。
- 使用 macOS Keychain 或 Windows DPAPI 加密保存 API Key，渲染页面无法读取已保存的明文。

自定义图片和音频保存在本机 IndexedDB 中，不会上传。自定义桌宠、Live2D 和完整视觉素材升级不属于当前一期范围。

## 官方场景素材

四个官方场景均内置经过优化的 1080p WebM 背景、WebP 静态兜底和五分钟 Ogg 环境音，因此桌面版安装后可以离线使用。开启“减少环境与桌宠动态”时只显示静态海报；视频或录音加载失败时会自动使用静态画面或程序化声音兜底。

素材来源、作者、许可证、处理方式及 SHA-256 记录在 [`THIRD_PARTY_ASSETS.md`](./THIRD_PARTY_ASSETS.md)。新增或替换素材时必须同步更新该文件。用户导入的自定义背景和白噪音只保存在本机，不进入官方素材库。
