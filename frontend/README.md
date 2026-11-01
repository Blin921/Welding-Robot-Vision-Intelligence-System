# WELD VISION · Next.js 动态前端

依据《NextJS 前端需求开发说明书 V1.0》和用户提供的界面 PDF 实现。范围为动态网页、前端状态与同源 API 客户端；没有新增或改动 FastAPI、模型、相机驱动、程序生成器或 FTP 服务。

## 数据采集参考图版 v0.3.0

本次只重写数据采集页，并将其设为默认打开页。以用户最新的 1680×944 参考图为布局和取色依据：顶栏、三栏面板、五帧列表、扫描参数、预览工具和任务中心均使用固定设计坐标，窗口变化时等比例缩放。其他页面尚未按本次图片重做。

- 页面实现：`src/components/acquisition/AcquisitionPage.tsx`、`acquisition.module.css`。
- 点云渲染：独立 Three.js WebGL 视口，支持颜色切换、点大小、旋转、平移、缩放、适配、包围盒、投影、全屏及两点测量。
- 文件：真正解析上传的 ASCII / binary / binary_compressed PCD（LZF），在 Worker 中处理；支持 RGB / 语义 / 实例字段、300MB 限制与不合法数据提示；最多抽样显示 400000 点，原点数独立显示。导出当前显示样本为 binary PCD。
- 工作区：帧选择、显隐、卸载、清空、恢复。清空不删除后端文件。
- 任务：完整采集参数校验，共享任务互斥、202 提交、轮询、状态/错误日志筛选、会话历史。无相机时明确失败。
- 设置、连接检查、示例/真实后端切换及各面板折叠均可操作。

**参考数据来源**：`public/acquisition/reference.jpg` 是用户 PDF 第 4 页的原始内嵌 JPEG，用于静态标志/图标和参考示例。没有提供原始 PCD；示例工件由图中可见像素构成带估算深度的 2.5D 点几何，网格为独立地面材质。它不能恢复遮挡结构或真实毫米尺寸。示例显示 286742 个重建点，不代表恢复了原始扫描点。示例测距明确标注非物理距离。真实上传的 PCD 使用其 XYZ，按需求书毫米单位显示和测量。

对照截图：`screenshots/acquisition-v3.png`；1366 宽截图：`screenshots/acquisition-v3-1366.png`。没有宣称整页达到逐像素零差异；字体渲染、JPEG 原始压缩及浏览器会影响呈现。

## 启动与构建

已验证 Node.js 24.19.0、npm 11、Chrome/Chromium。依赖使用 npm 锁文件。

```sh
cd /workspace/Welding-Robot-Vision-Intelligence-System/frontend
npm ci
npm run dev
```

服务监听 `0.0.0.0:3000`。生产运行：

```sh
npm run build
npm run start
```

构建与运行不加载 CDN、远程字体或外部模型资源。初次安装 npm 依赖需要可访问 npm 注册表。每个云任务已处于隔离环境，直接使用现有仓库，不需要另建 Git worktree。

## 两种明确区分的数据模式

默认是**浏览器离线演示**，用于在本仓库没有后端的情况下开发界面。右上角“系统设置”可切换到**后端模式**；不会在接口失败时自动伪装成演示成功。

- 演示：默认五帧参考图夹具、异步任务、采集失败、标定状态、示意程序和模拟 FTP 结果。PCD 上传会解析并预览，但不执行 AI 推理。标定残差与程序均为夹具，不能用于真机。演示 .LS 不包含运动指令。
- 后端：浏览器只调用同源 `/api/*`；Next rewrites 转发到既有 FastAPI。模型缺失不阻止帧管理、标定和程序等其他界面。所有设备操作只由后端完成。

环境变量（可复制 `.env.example` 为 `.env.local`）：

```dotenv
BACKEND_ORIGIN=http://127.0.0.1:8000
NEXT_PUBLIC_DATA_MODE=demo
```

把 `NEXT_PUBLIC_DATA_MODE` 设为 `live` 可默认进入后端模式。这是构建时公开变量，生产环境修改后需重新构建。`BACKEND_ORIGIN` 修改后也需重新构建并重启，以更新 rewrites。前端不暴露后端端口，不需要浏览器跨域配置。

## 已实现的动态行为

| 需求          | 前端行为                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1 健康徽标 | 启动健康请求；模型 / C++ / 当前帧标定三枚徽标；错误悬停说明；残差 >1.5mm 警告。                                                                                                       |
| FR-2 帧管理   | 二进制 PUT 上传；扩展名、空体和 300MB 检查；来源与结果徽标；视图 / 焊缝 / 标定并行加载；竞态保护；无结果引导。                                                                        |
| FR-3 采集     | 完整参数、范围检查；与识别共用全局任务互斥；失败末行日志可见；409 友好提示。                                                                                                          |
| FR-4 识别     | 独立复用开关与高级参数；202 job_id；1.5 秒轮询；页面隐藏暂停轮询、恢复后立即检查；任务历史与终端日志；完成刷新。                                                                      |
| FR-5 点云     | 定长头协议与越界检查；xyz / rgb / instance 零拷贝 TypedArray；相机系统一 (x,−y,z)；两套本地配色；实例 0 深灰；其他工作台 1–6、采集页 1–8 点大小；按 extent/center 重置；10mm 网格；会话缓存与 GPU 资源释放。 |
| FR-6 焊缝     | 原文 shape/type、真实长度、搜索与最短长度过滤；查看 / 预演 / 生成 / 下发入口；上下键选择；黄色粗线 + 白球高亮，其他青色细线。                                                         |
| FR-7 标定     | 按帧保存输入草稿与状态；点对增删、至少三组、有限数校验；JSON / 4×4 矩阵高级输入；清除二次确认；展示 calib_tag 与可获得的残差；保存后旧程序失效。                                      |
| FR-8 程序     | ProgramReq 全字段受控表单与文档默认值；空名自动命名；名称 / WPR 校验；未标定二次确认、生成后“禁止上机”；advisory 提示、复制、同源下载；坐标超限错误引导。                             |
| FR-9 预演     | 只用生成响应的 waypoints_cam_mm + wpr_list；100mm/s 弧长时间轴；播放 / 暂停 / 重置 / 拖动 / 0.2–3×；第三点与倒数第二点各 FINE 0.4s；ZYX WPR；TCP 锥体、三轴与橙色已走轨迹。           |
| FR-10 下发    | 完整 FTP 参数与校验；按帧 + 焊缝关联已生成程序；确认主机 / 目录 / 名称 / 覆盖；显示字节、远端路径和覆盖警告；后端错误透出；仅记忆非敏感连接信息，密码只在内存中。                     |

未标定程序可生成供检查，但前端不允许向控制器下发；必须完成标定并重新生成。系统不提供任何电机启动接口或按钮。

首页大图是固定展示，已移除小悬浮框和调节入口。五张功能卡片使用独立设计的本地 SVG 示意图；工作台保留三维调节。数据采集页使用参考图固定浅色和整体等比例缩放；其他页面保留原有深浅主题与自适应布局。

## API 与尚待后端核对的内容

13 个 HTTP 端点均集中在 `src/lib/api.ts`，请求体、HTTP 方法与顶层字段按说明书实现，统一处理 400 / 404 / 409 / 413 / 502。上传不是 multipart。接口失败不伪装成功；请求超时与中断受控。前端不复刻刚体标定、ASCII 消毒、坐标限位、程序生成或 FTP 二进制传输逻辑。

**当前仓库未提供**说明书中的 `webapp/app.py`、`schemas.py`、`pipeline.py` 和 `out/weld2tp/sw2_e30`，因此没有实际 FastAPI / 模型 / 相机 / 控制器联调证据。以下嵌套结构在 PDF 中未完全定义，接入真实代码时需以 `schemas.py` 为准核对：

- `pairs` 暂采用 `{cam:[x,y,z], base:[x,y,z]}[]`；高级 JSON 同样接受这两个键。若后端键名不同，只修改 API 适配层及相应类型，不改业务组件。
- `seams[]` 采用 `{id:number, shape:string, type:string, length_mm:number, trajectory_mm:[x,y,z][]}`。
- 采集成功若返回 `result.frame` 则自动选择该帧；否则刷新帧列表。
- GET 标定契约只保证 tag / has_calib / uncalibrated；前端会保留本会话 POST 返回的残差。若新会话没有残差数据，显示“—”，不编造精度。

## 检查

```sh
npm run typecheck
npm run lint
npm run test
npm run build
# 另一个终端启动：npm run start -- -p 3005
APP_URL=http://127.0.0.1:3005 npm run test:ui
```

- Vitest：二进制固定字节夹具、统一坐标翻转、弧长与 FINE、表单验证、HTTP 请求契约、帧缓存与竞态、任务隐藏暂停、程序失效保护。
- 当前浏览器检查：帧选择/显隐/卸载/清空/恢复、真实 PCD Worker 上传/解析/导出/错误、颜色/点大小/三维操作/测距/全屏、面板折叠、设置、扫描校验/互斥/失败日志/历史/响应式缩放；受控 HttpApi 夹具验证 202、精确请求体、轮询完成及新帧选择。**这些不是实际后端或设备验收。**
- `test:ui` 默认使用系统 `/usr/bin/chromium`；可用 `CHROMIUM_PATH` 指定浏览器。没有系统 Chromium 时，可用 Playwright 安装的浏览器。
- 截图保存在 `screenshots/`，包含深浅首页、识别、焊缝管理、预演和 1366px 布局。

20 万点 30fps、局域网冷缓存首屏 2 秒、网络下载 + 解析 500ms、Chrome/Edge 真机、真实标定与 .LS / FTP 回归，仍需目标机器及项目组后端联调验收。软件渲染截图不用于宣称这些性能指标已达成。

## 目录

```text
src/app/             页面入口、全局样式、Next App Router 布局
src/components/      首页插图、工作流表单、上下文、三维视图、预演、任务中心
src/lib/             协议类型、API、浏览器夹具、校验、二进制解析、时间轴
src/stores/          全局工作空间、任务互斥、轮询、缓存、结果关联
src/lib/__tests__/   Vitest 测试
scripts/             Playwright 浏览器验证
```

## 预构建下载包

`deliverables/WeldVision-Acquisition-v3.zip` 包含 `runtime` 生产构建、Node.js 运行依赖、完整前端源码和启动器。完整解压后执行根目录 `node launch.cjs`，或 Windows 双击 `Start-Windows.bat`。不需要 npm 安装、镜像或首次编译。启动器仅监听本机 `127.0.0.1`，自动选择 3000–3010 可用端口。

源码开发和预构建运行包分开存放；修改 `frontend/src` 后请用 `npm ci`、`npm run dev` 开发，或 `npm run build`、`npm run start` 重新运行生产构建。`postbuild` 自动将 public 和静态资源复制到 standalone。预构建默认为示例模式；真实后端模式通过界面设置切换。下载包生产构建使用默认后端地址 `127.0.0.1:8000`，修改后端地址后须从源码重新构建。

运行环境验证：Linux + Node.js 24 + Chromium。Windows/macOS 启动入口已提供，但本环境不能完成对应系统真机验证。

数据采集界面检查：`APP_URL=http://localhost:3007 npm run test:ui`。受控 HTTP 契约检查：`APP_URL=http://localhost:3007 node scripts/acquisition-api-check.cjs`；此项不等于 RVC 相机联调。
