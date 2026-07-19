# Windows 安装选项与 Portable 发布设计

## 目标

将 Windows NSIS 从默认一键安装改为交互式安装向导，让用户选择当前用户安装或所有用户安装，并允许修改安装目录。同时在 GitHub Actions 和 GitHub Release 中增加 portable 单文件版本。

Portable 版本不自动下载或覆盖自身，但会检查 GitHub 最新稳定版本；发现新版后提示用户并提供可信的 GitHub Release 下载链接。

## 安装版行为

electron-builder 的 NSIS 配置设置：

- `oneClick: false`：显示安装向导。
- `perMachine: false`：显示安装模式页，允许选择当前用户或所有用户。
- `allowToChangeInstallationDirectory: true`：显示目录选择页。

当前用户模式默认安装到 `%LOCALAPPDATA%\Programs\伴读`，无需管理员权限。所有用户模式默认安装到 `%ProgramFiles%\伴读`，由 Windows 请求管理员授权。用户可以在安装模式确定后修改目标目录。

安装版继续使用现有 `electron-updater` 流程：自动检查和下载，完成后提示立即重启更新或稍后。

## Portable 行为

Windows 构建同时生成 `nsis` 与 `portable` 两个 target，并使用可区分的 artifact 名称。Portable 不写入安装目录，不创建卸载项，也不参与 NSIS 自动覆盖更新。

应用通过 electron-builder portable 运行时提供的 `PORTABLE_EXECUTABLE_FILE` 判断 portable 模式。Portable 模式不实例化 NSIS updater，而是使用只读版本检查器访问公开 GitHub Release：

1. 启动后延迟检查，随后按现有周期继续检查。
2. 只接受 `https://github.com/Indigo6/companion-study-room/releases/` 范围内的下载页面。
3. 最新稳定版本高于当前版本时发布 `available` 状态，动作类型为 `open-download`。
4. 用户点击“前往下载”后，主进程使用系统浏览器打开对应 Release 页面。
5. 不在后台下载 EXE，不尝试覆盖当前 portable 文件。

网络失败只显示非阻塞错误，不影响应用使用。

## 发布流程

Windows CI 使用 electron-builder 同时构建 `nsis` 和 `portable`。Artifact 与标签触发的 GitHub Release 包含：

- Assisted NSIS 安装包。
- Portable EXE。
- NSIS blockmap。
- `latest.yml` 更新元数据。

安装版和 portable 文件名必须包含用途标识，避免用户混淆。Portable 不进入 `latest.yml` 的自动更新文件选择。

自建 generic 更新源继续服务安装版，本期 portable 新版本提示固定使用公开 GitHub Releases。

## 安全边界

- 渲染进程不能提交任意外部 URL。
- Portable checker 生成并校验 Release URL；IPC 只接受预先保存的当前更新链接。
- 只检查稳定版，不允许降级或预发布版本。
- Portable 模式绝不调用 `quitAndInstall()`。
- 所有用户安装所需提权完全由 NSIS 和 Windows UAC 处理。

## 测试与验收

自动化测试覆盖：

- NSIS assisted、per-user/per-machine 和目录选择配置。
- Windows target 同时包含 `nsis` 与 `portable`。
- CI Artifact 和 Release 包含两类 EXE。
- Portable 模式识别。
- Portable checker 的版本比较、GitHub Release URL、网络错误和预发布过滤。
- Portable 提示展示“前往下载 / 稍后”。
- 点击下载只打开已验证的 GitHub Release URL，不调用安装或下载 API。
- 安装版原有自动更新测试继续通过。

真实验收在 Windows 上分别运行安装包和 portable：验证当前用户默认路径、所有用户默认路径与 UAC、自定义目录、两个产物可独立启动，以及 portable 新版本链接能在默认浏览器打开。
