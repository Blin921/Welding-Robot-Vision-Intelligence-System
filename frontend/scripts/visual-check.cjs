const { chromium, expect } = require("@playwright/test");
const fs = require("node:fs");
const baseURL = process.env.APP_URL || "http://127.0.0.1:3002";
function cloudFixture() {
  const buffer = Buffer.alloc(2086),
    header = {
      version: 1,
      units: "mm",
      frame: "camera",
      frame_id: "sw2_e30",
      n: 2,
      n_full: 2,
      source: "dataset",
      center: [0, 0, 0],
      extent: [-50, -50, -50, 50, 50, 50],
      semantic_counts: { pipe: 2 },
      n_instances: 1,
      offsets: { xyz: 2052, rgb: 2076, instance: 2082 },
    };
  const encoded = Buffer.from(JSON.stringify(header));
  buffer.writeUInt32LE(encoded.length);
  encoded.copy(buffer, 4);
  [-50, 0, -50, 50, 0, 50].forEach((v, i) =>
    buffer.writeFloatLE(v, 2052 + i * 4),
  );
  Buffer.from([70, 130, 230, 70, 130, 230]).copy(buffer, 2076);
  buffer.writeUInt16LE(1, 2082);
  buffer.writeUInt16LE(1, 2084);
  return buffer;
}
let browser;
async function main() {
  fs.mkdirSync("screenshots", { recursive: true });
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    headless: true,
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const nav = async (index) => page.locator("nav button").nth(index).click();
  const status = () => page.getByRole("status");
  await page.goto(baseURL, { waitUntil: "load" });
  await page.locator("canvas").waitFor();
  await expect(page.locator(".app")).toHaveClass(/light/);
  await expect(page.locator(".page-heading,.workflow-stepper")).toHaveCount(0);
  await expect(page.locator(".brand")).toContainText("焊缝识别系统");
  await page.getByRole("button", { name: "切换深浅主题" }).click();
  await expect(page.locator(".hero .floating-tag")).toHaveCount(0);
  await expect(
    page.locator(".hero-cloud button,.hero-cloud input"),
  ).toHaveCount(0);
  await expect(page.locator(".feature-art")).toHaveCount(5);
  await expect(page.locator(".hero .static-cloud")).toHaveCount(1);
  await page.screenshot({
    path: "screenshots/01-overview-dark.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "切换深浅主题" }).click();
  await page.screenshot({
    path: "screenshots/02-overview-light.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "切换深浅主题" }).click();
  await nav(1);
  await page
    .locator(".left-column")
    .getByRole("button", { name: "开始采集", exact: true })
    .click();
  await nav(2);
  await expect(page.locator(".log-list")).toContainText("本机未接相机", {
    timeout: 10000,
  });
  await page.getByRole("button", { name: "开始识别", exact: true }).click();
  await expect(status()).toContainText("识别完成", { timeout: 10000 });
  await page.screenshot({
    path: "screenshots/03-recognition-dark.png",
    fullPage: true,
  });
  await nav(1);
  const upload = page.locator("input[type=file]");
  await upload.setInputFiles({
    name: "local_test.pcd",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("PCD FILE"),
  });
  await expect(page.locator(".main-cloud")).toContainText("等待点云识别结果");
  await page
    .getByRole("button", { name: "选择帧 sw2_e30", exact: true })
    .click();
  await page.locator(".main-cloud canvas").waitFor();
  await nav(2);
  await nav(4);
  await page.locator(".seam-list").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".seam-card.selected strong")).toHaveText("W002");
  await page.getByRole("button", { name: "切换深浅主题" }).click();
  await page.screenshot({
    path: "screenshots/04-seams-light.png",
    fullPage: true,
  });
  await nav(5);
  await page.getByLabel("姿态 W,P,R", { exact: true }).fill("180,,0");
  await page
    .getByRole("button", { name: "生成 .LS 程序", exact: true })
    .click();
  await expect(status()).toContainText("WPR");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("姿态 W,P,R", { exact: true }).fill("180,0,0");
  await page
    .getByRole("button", { name: "生成 .LS 程序", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("禁止上机");
  await page.getByRole("button", { name: "确认生成", exact: true }).click();
  await expect(page.locator(".code-preview")).toBeVisible();
  await page.getByRole("button", { name: "播放", exact: true }).click();
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  const seek = page.getByRole("slider", { name: "预演进度" });
  await seek.evaluate((input) => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(input, "14");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(seek).toHaveValue("14");
  await expect(page.locator(".fine-badge")).toContainText("FINE");
  await expect(page.locator(".playback .mono")).toContainText(
    "71.3 / 570.0 mm",
  );
  await page.getByLabel("播放速度", { exact: true }).selectOption("3");
  await expect(page.getByLabel("播放速度", { exact: true })).toHaveValue("3");
  await page.screenshot({
    path: "screenshots/05-program-light.png",
    fullPage: true,
  });
  await nav(6);
  await page.getByRole("button", { name: "预览下发确认" }).click();
  await expect(status()).toContainText("禁止上机");
  await nav(3);
  await page.getByRole("button", { name: "保存标定", exact: true }).click();
  await expect(status()).toContainText("标定已保存");
  await page.screenshot({ path: "screenshots/07-calibration-light.png" });
  await nav(5);
  await expect(page.locator(".code-preview")).toHaveCount(0);
  await page
    .getByRole("button", { name: "生成 .LS 程序", exact: true })
    .click();
  await expect(page.locator(".code-preview")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 .LS", exact: true }).click();
  const download = await downloadPromise;
  await expect(download.suggestedFilename()).toMatch(/\.ls$/i);
  await nav(6);
  await page.getByLabel("控制器地址", { exact: true }).fill("robot.demo");
  await page.getByLabel("密码", { exact: true }).fill("test-do-not-save");
  await page.getByRole("button", { name: "预览下发确认" }).click();
  await expect(page.getByRole("dialog")).toContainText("robot.demo:21");
  await expect(page.getByRole("dialog")).toContainText("同名程序将被覆盖");
  await expect(page.getByRole("dialog")).not.toContainText("test-do-not-save");
  await page.getByRole("button", { name: "确认模拟下发", exact: true }).click();
  await expect(status()).toContainText("模拟传输完成");
  await page.screenshot({ path: "screenshots/08-deployment-light.png" });
  await page.getByRole("button", { name: "预览下发确认" }).click();
  await page.getByRole("button", { name: "确认模拟下发", exact: true }).click();
  await expect(status()).toContainText("已覆盖控制器同名程序");
  const saved = await page.evaluate(() =>
    localStorage.getItem("weld-ftp-preferences"),
  );
  expect(saved).not.toContain("test-do-not-save");
  expect(saved).not.toContain("password");
  await page.getByLabel("控制器地址", { exact: true }).fill("fail.demo");
  await page.getByRole("button", { name: "预览下发确认" }).click();
  await page.getByRole("button", { name: "确认模拟下发", exact: true }).click();
  await expect(status()).toContainText("模拟 FTP 连接失败");
  await page
    .getByRole("button", { name: "任务中心", exact: false })
    .first()
    .click();
  await expect(page.locator(".task-history button")).toHaveCount(2);
  await page.getByRole("button", { name: "收起任务中心" }).click();
  await page.setViewportSize({ width: 1366, height: 768 });
  await nav(2);
  await page.screenshot({
    path: "screenshots/06-recognition-1366.png",
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    1366,
  );
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.getByRole("button", { name: "焊缝与上下文", exact: true }).click();
  await expect(page.locator(".left-column .seam-list")).toBeVisible();
  expect(
    await page.locator(".main-cloud").evaluate((el) => el.clientWidth),
  ).toBeGreaterThanOrEqual(600);
  await page.setViewportSize({ width: 1600, height: 900 });
  // Exercise the real HTTP adapter against a controlled contract fixture, not a running backend.
  let calibrated = false,
    polls = 0;
  const calls = [];
  const points = [
    [0, 0, 0],
    [20, 0, 0],
    [40, 0, 0],
    [60, 0, 0],
    [80, 0, 0],
    [100, 0, 0],
  ];
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname,
      method = req.method();
    let body;
    try {
      body = req.postDataJSON();
    } catch {
      body = null;
    }
    calls.push({ path, method, body });
    const json = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    if (path === "/api/health")
      return json({ model_ok: true, model_error: null, cpp_ok: true });
    if (path === "/api/frames")
      return json({
        frames: [
          {
            id: "sw2_e30",
            source: "dataset",
            bytes: 6000000,
            mtime: 1,
            has_artifacts: true,
          },
        ],
      });
    if (path === "/api/view/sw2_e30")
      return route.fulfill({
        contentType: "application/octet-stream",
        body: cloudFixture(),
      });
    if (path === "/api/seams/sw2_e30")
      return json({
        frame: "sw2_e30",
        uncalibrated: !calibrated,
        calib_tag: calibrated ? "live-calib" : null,
        seams: [
          {
            id: 1,
            shape: "钢管-扁钢",
            type: "相切",
            length_mm: 100,
            trajectory_mm: points,
          },
        ],
        primitives: [],
      });
    if (path === "/api/calib/sw2_e30")
      return json({
        has_calib: calibrated,
        uncalibrated: !calibrated,
        calib_tag: calibrated ? "live-calib" : null,
      });
    if (path === "/api/calib" && method === "POST") {
      calibrated = !body.clear;
      return json({
        calib_tag: calibrated ? "live-calib" : "",
        max_dev_mm: 1.8,
        mean_dev_mm: 0.7,
      });
    }
    if (path === "/api/recognize") return json({ job_id: "http-job" }, 202);
    if (path === "/api/jobs/http-job") {
      polls++;
      return json({
        id: "http-job",
        kind: "recognize",
        state: polls < 2 ? "running" : "done",
        log: polls < 2 ? ["processing"] : ["processing", "finished"],
        error: null,
        result: polls < 2 ? null : { n_seams: 1, seconds: 1.5 },
        seconds: 1.5,
      });
    }
    if (path === "/api/program" && method === "POST")
      return json({
        ls_name: "LIVE001",
        ls_text: "/PROG LIVE001\n/MN\n! Contract fixture only\n/END",
        issues: ["advisory fixture"],
        waypoints_cam_mm: points,
        waypoints_base_mm: points.map((p) => p.map((n) => n + 10)),
        wpr_list: points.map(() => [180, 0, 0]),
        download: "/api/program/LIVE001/download",
      });
    if (path === "/api/program/LIVE001/download")
      return route.fulfill({
        contentType: "text/plain",
        body: "/PROG LIVE001\n/END",
      });
    if (path === "/api/push")
      return json({
        remote_path: "MD:/LIVE001.ls",
        bytes: 26,
        existed_before: true,
      });
    return json({ detail: "unhandled fixture route " + path }, 404);
  });
  await page.getByRole("button", { name: "系统设置", exact: true }).click();
  await page
    .getByRole("button", { name: "后端模式", exact: false })
    .filter({ has: page.locator("strong") })
    .click();
  await expect(page.locator(".health")).toContainText("模型 · 就绪");
  await nav(2);
  await page.locator("canvas").waitFor();
  const viewCount = () =>
    calls.filter((c) => c.path.startsWith("/api/view/")).length;
  const before = viewCount();
  await page.getByRole("button", { name: "实例", exact: true }).click();
  await page.getByRole("button", { name: "语义", exact: true }).click();
  expect(viewCount()).toBe(before);
  await page.getByRole("button", { name: "开始识别", exact: true }).click();
  await expect(status()).toContainText("识别完成：1 条焊缝", {
    timeout: 10000,
  });
  expect(calls.find((c) => c.path === "/api/recognize").body).toMatchObject({
    frame: "sw2_e30",
    reuse_artifacts: false,
    voxel: 1.5,
    tile: 200,
    stride: 120,
    smooth_k: 16,
    smooth_r: 3,
    max_gap: 0.008,
    min_len: 50,
  });
  await nav(3);
  await page.getByRole("button", { name: "保存标定", exact: true }).click();
  await expect(status()).toContainText("最大残差超过 1.5mm");
  await expect(page.locator(".health")).toContainText("标定需复核");
  await nav(5);
  await page.getByLabel("程序名称", { exact: true }).fill("LIVE001");
  await page.getByLabel("姿态 W,P,R", { exact: true }).fill("invalid");
  const programCount = calls.filter((c) => c.path === "/api/program").length;
  await page
    .getByRole("button", { name: "生成 .LS 程序", exact: true })
    .click();
  await expect(status()).toContainText("WPR");
  expect(calls.filter((c) => c.path === "/api/program").length).toBe(
    programCount,
  );
  await page.getByLabel("姿态 W,P,R", { exact: true }).fill("180,0,0");
  await page
    .getByRole("button", { name: "生成 .LS 程序", exact: true })
    .click();
  await expect(page.locator(".code-preview")).toContainText("Contract fixture");
  await expect(page.locator(".issues")).toContainText("advisory fixture");
  expect(calls.find((c) => c.path === "/api/program").body).toEqual({
    frame: "sw2_e30",
    seam_id: 1,
    name: "LIVE001",
    comment: "",
    utool: 1,
    uframe: 0,
    weld: false,
    inst: "Weld",
    weld_prog: 1,
    weld_set: 1,
    speed_weld: 30,
    eps: 0.5,
    max_seg: 50,
    wpr: "180,0,0",
  });
  const liveDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 .LS", exact: true }).click();
  await liveDownload;
  expect(calls.some((c) => c.path === "/api/program/LIVE001/download")).toBe(
    true,
  );
  await nav(6);
  await page.getByLabel("控制器地址", { exact: true }).fill("controller.test");
  await page.getByRole("button", { name: "预览下发确认" }).click();
  await page.getByRole("button", { name: "确认传输文件", exact: true }).click();
  await expect(status()).toContainText("已覆盖控制器同名程序");
  expect(calls.find((c) => c.path === "/api/push").body).toMatchObject({
    host: "controller.test",
    port: 21,
    frame: "sw2_e30",
    seam_id: 1,
    remote_dir: "MD:",
    passive: true,
  });
  expect(errors).toEqual([]);
  console.log(
    JSON.stringify(
      {
        pageErrors: errors,
        screenshots: 8,
        demoChecks: [
          "homepage decorations removed",
          "five new feature illustrations",
          "task exclusion",
          "camera error",
          "recognition polling",
          "upload empty state",
          "keyboard selection",
          "WPR validation",
          "uncalibrated confirmation",
          "program invalidation",
          "playback, FINE seek, speed",
          "download",
          "FTP confirmation/overwrite/error",
          "password exclusion",
          "1366 layout",
          "1100 context tabs",
        ],
        httpFixtureChecks: [
          "health badges",
          "local color switch",
          "recognition payload",
          "job polling",
          "calibration residual warning",
          "program payload",
          "download endpoint",
          "FTP payload",
        ],
        realBackendTested: false,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => browser?.close());
