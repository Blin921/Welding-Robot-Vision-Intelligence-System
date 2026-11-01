# Welding-Robot-Vision-Intelligence-System

焊接机器人视觉智能系统，展示焊缝识别功能

## Next.js 动态前端

源码位于 [frontend/](frontend/)，完整开发与接口说明见 [frontend/README.md](frontend/README.md)。

### 下载并运行

下载新版 [WeldVision-Acquisition-v3.zip](deliverables/WeldVision-Acquisition-v3.zip)，完整解压到新文件夹后：

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

本次重写数据采集页并默认打开。按最新 1680×944 参考图安排顶栏、三栏面板、帧列表、扫描参数、三维工具和任务中心；其余页面尚未按本次图片重写。

先看 [新版数据采集截图](frontend/screenshots/acquisition-v3.png)。支持真实 PCD 解析/预览/导出、帧管理、点云操作、参数校验、任务互斥/轮询、日志与历史。没有原始 PCD，参考工件是图片可见像素重建示例，不能恢复遮挡结构或真实物理尺寸；真采集需要现有后端及相机。未宣称整页逐像素零差异。

如果已有旧版在运行，请以新版启动窗口打印的 READY 地址为准。
