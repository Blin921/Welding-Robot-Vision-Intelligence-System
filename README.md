# Welding-Robot-Vision-Intelligence-System
焊接机器人视觉智能系统，展示焊缝识别功能

## Next.js 动态前端

源码位于 [frontend/](frontend/)，完整开发与接口说明见 [frontend/README.md](frontend/README.md)。

### 下载并运行

下载 [WeldVision-frontend.zip](deliverables/WeldVision-frontend.zip)，完整解压后：

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
