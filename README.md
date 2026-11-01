# Welding-Robot-Vision-Intelligence-System

焊接机器人视觉智能系统，展示焊缝识别功能

## Next.js 动态前端

源码位于 [frontend/](frontend/)，完整开发与接口说明见 [frontend/README.md](frontend/README.md)。

### 下载并运行

下载新版 [WeldVision-PDF-v2.zip](deliverables/WeldVision-PDF-v2.zip)，完整解压到新文件夹后：

- 安装 [Node.js 24 LTS 或更新版本](https://nodejs.org/)。
- Windows 双击 `Start-Windows.bat`；macOS 双击 `Start-Mac.command`；Linux 执行 `sh start.sh`。
- 首次运行自动安装 npm 依赖，服务就绪后打开浏览器。
- 默认端口 3000，被占用时自动使用 3001–3010；以启动窗口的 `READY` 地址为准。

也可直接从源码启动：

```sh
cd frontend
npm ci
npm run dev
```

默认使用浏览器演示数据，不需要相机和后端。真实后端与机器人控制器不包含在此交付中。

## PDF 界面对照版 v2

已按界面 PDF 恢复浅色工业风、中文顶栏、原有面板分组和三栏布局；首页保留已确认的两项调整。可以先查看 [新版浅色首页](frontend/screenshots/02-overview-light.png) 和 [新版 AI 识别工作台](frontend/screenshots/09-recognition-light.png)。

如果已有旧版在运行，请以新版启动窗口打印的 READY 地址为准。启动器会在端口占用时自动选择 3001–3010。
