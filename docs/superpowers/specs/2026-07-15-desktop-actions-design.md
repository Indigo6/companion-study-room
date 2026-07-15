# 桌面安装包 GitHub Actions 设计

## 目标

提供可手动触发的 GitHub Actions，在 GitHub 托管的原生 Windows 与 macOS Runner 上构建未签名内部测试安装包，并通过 Workflow Artifacts 下载。

## 架构

- `windows-latest` 构建 Windows x64 NSIS 安装程序。
- `macos-15` 构建 Apple Silicon DMG，`macos-15-intel` 构建 Intel DMG。
- 所有任务使用 Node.js 22、`npm ci`、前端测试及 electron-builder。
- 产物保留 14 天；任务仅使用仓库源代码与 GitHub 自动令牌，不读取模型密钥。

## 验证

本地结构测试检查手动触发、三个 Runner、测试步骤、打包参数与 Artifact 上传配置。推送后通过 GitHub Actions 实际运行结果完成平台构建验证。
