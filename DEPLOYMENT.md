# 部署与验收（Next.js 前端）

1. 安装 Git、Node.js 24 LTS，在仓库根目录执行 `git pull origin main`。
2. 把 `frontend/.env.example` 复制为 `frontend/.env.local`，设置 `BACKEND_ORIGIN=http://127.0.0.1:8000`、`NEXT_PUBLIC_DATA_MODE=live`。
3. 按原后端项目 README 启动既有 FastAPI。无模型开发时设置 `WEBAPP_NO_MODEL=1`；准备真实 `out/weld2tp/sw2_e30`。本仓库没有附带该后端与数据。
4. 开发执行 `npm run dev`；生产执行 `npm run build`，再 `npm start`。保持窗口开启，在浏览器访问终端地址。局域网客户端访问主机 IP:3000，只开放前端端口；浏览器通过同源 `/api/*` 代理访问后端。
5. 先检查 `http://localhost:3000/api/health`。模型未加载允许继续；前端不会在接口失败时自动改为模拟成功。没有后端时可手动在设置选择浏览器自测，不能把其结果算作联调通过。
6. 验收顺序：选 sw2_e30 → 复用历史结果识别 → 选择焊缝 → 标定并复核残差 → 生成 .LS → TCP 播放/拖动/变速 → 下载；项目组值守时再测试真实采集/识别及 FTP（含同名覆盖和失败）。系统只传文件，不启动电机。
7. 目标 Chrome/Edge 上检查：1366×768/1920×1080 满屏、<1200px 上下文页签、三维区 ≥600px；20万点 ≥30fps；局域网冷首屏 ≤2s，下载+解析 ≤500ms；切换配色无请求、重复选帧使用缓存、隐藏页面暂停轮询、长时间操作内存不持续增长。

首次依赖下载慢：`npm config set registry https://registry.npmmirror.com`。恢复：`npm config set registry https://registry.npmjs.org`。修改环境变量后开发重启，生产重新构建。自动化契约测试不代替真实后端、性能或设备验收。
