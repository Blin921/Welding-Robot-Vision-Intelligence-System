# Welding-Robot-Vision-Intelligence-System

焊接机器人视觉智能系统，展示焊缝识别功能

## Next.js 动态前端

源码位于 [frontend/](frontend/)，完整开发与接口说明见 [frontend/README.md](frontend/README.md)。

### 推荐：用 Git 更新并运行（Windows CMD）

先安装 Git for Windows 和 Node.js 24 LTS。首次只需克隆一次：

```cmd
git clone --single-branch --branch codex/weld-vision-frontend https://github.com/Blin921/Welding-Robot-Vision-Intelligence-System.git
cd Welding-Robot-Vision-Intelligence-System
Update-And-Start.cmd
```

以后先在旧运行窗口按 Ctrl+C 停止，再进入本地仓库执行 `Update-And-Start.cmd`。脚本执行 `git pull --ff-only`，只有首次启动、依赖清单或 Node/平台变化才执行 `npm ci`，然后用开发模式运行最新源码，无需每次生产构建或下载压缩包。打开终端打印的 Local 地址，默认 http://localhost:3000，端口占用时 Next.js 会提示实际地址。更新冲突会停止，不强制覆盖本地修改。

已有此分支的 Git 仓库可先执行 `git pull --ff-only` 获取脚本。旧 ZIP 解压目录没有 `.git`，不能直接拉取更新，请在新目录首次克隆。只启动而不联网更新时执行 `Start-From-Git.cmd`。

首次依赖下载慢，可先执行 `npm config set registry https://registry.npmmirror.com`；恢复官方源：`npm config set registry https://registry.npmjs.org`。后续仅改页面代码时会跳过依赖安装。

### 旧版压缩包（不随 Git 源码更新）

旧的 v3 运行包 [WeldVision-Acquisition-v3.zip](deliverables/WeldVision-Acquisition-v3.zip)，完整解压到新文件夹后：

- 安装 [Node.js 24 LTS 或更新版本](https://nodejs.org/)。
- Windows 双击 `Start-Windows.bat`；macOS 双击 `Start-Mac.command`；Linux 执行 `sh start.sh`。
- 已包含生产运行依赖；不需要 npm ci 或首次编译。也可在解压目录执行 `node launch.cjs`。
- 默认端口 3000，被占用时自动使用 3001–3010；以启动窗口的 `READY` 地址为准。

也可直接从源码启动：

```sh
cd frontend
npm ci
npm run dev
```

默认使用浏览器演示数据，不需要相机和后端。真实后端与机器人控制器不包含在此交付中。

## 数据采集参考图版 v3

所有页面按 PDF 调整模块、排版和颜色；数据采集保留当前三栏排版。所有三维页面恢复共用原有 PointCloud 渲染器、原始演示点云和 RAF 动画循环，不使用截图重建点云，不增加限帧或更改预演播放速度。

先看 [新版数据采集截图](frontend/screenshots/acquisition-v3.png)。支持真实 PCD 解析/预览/导出、帧管理、点云操作、参数校验、任务互斥/轮询、日志与历史。三维数据保持原实现；真采集需要现有后端及相机。未宣称整页逐像素零差异。

如果已有旧版在运行，请以新版启动窗口打印的 READY 地址为准。

当前排版截图见 `frontend/screenshots/layout-acquisition.png` 及 `layout-page-0/2/3/4/5/6.png`。最新改动请使用上面的 Git CMD 流程运行。
