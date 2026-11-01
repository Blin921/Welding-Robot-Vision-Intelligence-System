const { chromium, expect } = require("@playwright/test");
const fs = require("node:fs");
const ts = require("typescript");
const compiled = ts.transpileModule(
  fs.readFileSync("src/lib/demo-data.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const fixtures = {};
new Function("exports", compiled)(fixtures);
const cloud = Buffer.from(fixtures.demoCloud()),
  seams = fixtures.demoSeams();
(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: true,
    });
    page.setDefaultTimeout(15000);
    const errors = [],
      calls = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let jobId = "fixture-job",
      jobSerial = 0;
    let calibrated = false,
      scanDone = false,
      uploaded = false,
      jobKind = "",
      polls = 0,
      simulate409 = false,
      pushes = 0;
    const frames = () => [
      {
        id: "sw2_e30",
        source: "dataset",
        bytes: 3400000,
        mtime: 1,
        has_artifacts: true,
      },
      {
        id: "frame_002",
        source: "camera",
        bytes: 3400000,
        mtime: 2,
        has_artifacts: true,
      },
      {
        id: "frame_003",
        source: "upload",
        bytes: 3400000,
        mtime: 3,
        has_artifacts: false,
      },
      ...(uploaded
        ? [
            {
              id: "upload_test",
              source: "upload",
              bytes: 160,
              mtime: 4,
              has_artifacts: false,
            },
          ]
        : []),
      ...(scanDone
        ? [
            {
              id: "scan_result",
              source: "camera",
              bytes: 3400000,
              mtime: 5,
              has_artifacts: true,
            },
          ]
        : []),
    ];
    await page.route("**/api/**", async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        path = url.pathname,
        method = request.method();
      let body = null;
      if (method === "POST") body = request.postDataJSON();
      calls.push({ path, method, body, time: Date.now() });
      const json = (value, status = 200) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(value),
        });
      if (path === "/api/health")
        return json({
          model_ok: false,
          model_error: "fixture: model disabled for offline reuse",
          cpp_ok: true,
        });
      if (path === "/api/frames") return json({ frames: frames() });
      if (path === "/api/frames/upload_test" && method === "PUT") {
        uploaded = true;
        return json({
          id: "upload_test",
          bytes: request.postDataBuffer().length,
        });
      }
      if (path.startsWith("/api/view/")) {
        if (["upload_test", "frame_003"].includes(path.split("/").pop()))
          return json({ detail: "无识别结果" }, 404);
        return route.fulfill({
          contentType: "application/octet-stream",
          body: cloud,
        });
      }
      if (path.startsWith("/api/seams/")) {
        if (["upload_test", "frame_003"].includes(path.split("/").pop()))
          return json({ detail: "无识别结果" }, 404);
        return json({
          frame: path.split("/").pop(),
          calib_tag: calibrated ? "calib-fixture" : null,
          uncalibrated: !calibrated,
          seams,
          primitives: [],
        });
      }
      if (path.startsWith("/api/calib/"))
        return json({
          calib_tag: calibrated ? "calib-fixture" : null,
          has_calib: calibrated,
          uncalibrated: !calibrated,
        });
      if (path === "/api/calib" && method === "POST") {
        calibrated = !body.clear;
        return json({
          calib_tag: calibrated ? "calib-fixture" : null,
          max_dev_mm: calibrated ? 1.8 : 0,
          mean_dev_mm: calibrated ? 0.7 : 0,
        });
      }
      if (path === "/api/scan" || path === "/api/recognize") {
        if (simulate409)
          return json({ detail: "已有任务运行，请稍后再试" }, 409);
        jobKind = path.endsWith("scan") ? "scan" : "recognize";
        polls = 0;
        jobId = `fixture-job-${++jobSerial}`;
        return json({ job_id: jobId }, 202);
      }
      if (path === `/api/jobs/${jobId}`) {
        polls++;
        const done = polls >= 2;
        if (done && jobKind === "scan") scanDone = true;
        return json({
          id: jobId,
          kind: jobKind,
          state: done ? "done" : "running",
          log: done ? ["任务受理", "fixture任务完成"] : ["任务受理"],
          error: null,
          result: done
            ? {
                frame: jobKind === "scan" ? "scan_result" : "sw2_e30",
                n_seams: 4,
                seconds: 3,
              }
            : null,
          seconds: polls * 1.5,
        });
      }
      if (path === "/api/program")
        return json({
          ls_name: "FIXTURE",
          ls_text: "/PROG FIXTURE\n/COMMENT = fixture only;\n/END",
          issues: ["fixture advisory"],
          waypoints_cam_mm: seams.find((s) => s.id === body.seam_id)
            .trajectory_mm,
          waypoints_base_mm: seams.find((s) => s.id === body.seam_id)
            .trajectory_mm,
          wpr_list: seams
            .find((s) => s.id === body.seam_id)
            .trajectory_mm.map(() => [180, 0, 0]),
          download: "/api/program/FIXTURE/download",
        });
      if (path === "/api/program/FIXTURE/download")
        return route.fulfill({
          contentType: "text/plain",
          headers: { "Content-Disposition": "attachment; filename=FIXTURE.ls" },
          body: "/PROG FIXTURE\n/END",
        });
      if (path === "/api/push") {
        pushes++;
        return json({
          remote_path: "/MD/FIXTURE.ls",
          bytes: 31,
          existed_before: pushes > 1,
        });
      }
      return json({ detail: "unexpected " + path }, 404);
    });
    const nav = async (i) => {
      await page.locator(".topbar nav button").nth(i).click();
    };
    const btn = (name) => page.getByRole("button", { name, exact: true });
    const status = () => page.locator(".toast");
    await page.goto(process.env.APP_URL || "http://localhost:3012");
    await page.locator("canvas").waitFor();
    await expect(
      page.getByRole("option", { name: "选择帧 sw2_e30" }),
    ).toBeVisible();
    await expect(page.locator(".health")).toContainText("未加载");
    const root = await page.locator(".app").boundingBox();
    expect(root.width).toBe(1920);
    expect(root.height).toBe(1080);
    expect(root.x).toBe(0);
    expect(root.y).toBe(0);
    expect(
      await page.locator(".viewer").evaluate((e) => e.clientWidth),
    ).toBeGreaterThanOrEqual(600);
    fs.mkdirSync("screenshots", { recursive: true });
    await page.screenshot({
      path: "screenshots/requirements-acquisition-1920.png",
    });
    await page.getByLabel("扫描时长", { exact: true }).fill("1");
    await btn("开始采集").first().click();
    await expect(status()).toContainText("500–20000");
    expect(calls.filter((c) => c.path === "/api/scan")).toHaveLength(0);
    await page.getByLabel("扫描时长", { exact: true }).fill("2500");
    await page.getByLabel("上传 PCD 文件", { exact: true }).setInputFiles({
      name: "upload_test.pcd",
      mimeType: "application/octet-stream",
      buffer: Buffer.from(
        "FIELDS x y z\nSIZE 4 4 4\nTYPE F F F\nWIDTH 3\nHEIGHT 1\nPOINTS 3\nDATA ascii\n0 0 0\n50 0 0\n0 50 0\n",
      ),
    });
    await expect(page.locator(".loaded-frame strong")).toHaveText(
      "upload_test",
    );
    await expect(page.locator(".viewport-status")).toContainText("3");
    expect(
      calls.some(
        (c) => c.path === "/api/frames/upload_test" && c.method === "PUT",
      ),
    ).toBe(true);
    await page
      .getByRole("option", { name: "选择帧 frame_003", exact: true })
      .click();
    await expect(page.locator(".viewer .empty")).toContainText(
      "当前帧无历史结果",
    );
    await page
      .getByRole("option", { name: "选择帧 sw2_e30", exact: true })
      .click();
    await page.locator("canvas").waitFor();
    const viewCount = calls.filter((c) =>
      c.path.startsWith("/api/view/"),
    ).length;
    await btn("实例").click();
    await btn("语义").click();
    await page.getByLabel("点大小", { exact: true }).fill("4");
    await page.getByRole("option", { name: "选择帧 frame_002" }).click();
    await page.locator("canvas").waitFor();
    await page.getByRole("option", { name: "选择帧 sw2_e30" }).click();
    await page.locator("canvas").waitFor();
    expect(calls.filter((c) => c.path.startsWith("/api/view/")).length).toBe(
      viewCount + 1,
    );
    for (const size of [
      { width: 1366, height: 768 },
      { width: 1100, height: 800 },
    ]) {
      await page.setViewportSize(size);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(size.width);
      const box = await page.locator(".app").boundingBox();
      expect(box.width).toBe(size.width);
      expect(box.height).toBe(size.height);
      expect(
        await page.locator(".viewer").evaluate((e) => e.clientWidth),
      ).toBeGreaterThanOrEqual(600);
      if (size.width < 1200) {
        await btn("焊缝与上下文").click();
        await expect(page.locator(".left-column")).toContainText("当前帧信息");
        await btn("工作流").click();
      }
      await page.screenshot({
        path: `screenshots/requirements-acquisition-${size.width}.png`,
      });
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await btn("开始采集").first().click();
    await expect
      .poll(() => calls.filter((c) => c.path === "/api/scan").length)
      .toBe(1);
    const beforePause = calls.filter((c) =>
      c.path.startsWith("/api/jobs/"),
    ).length;
    await page.waitForTimeout(1700);
    expect(calls.filter((c) => c.path.startsWith("/api/jobs/")).length).toBe(
      beforePause,
    );
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(page.locator(".loaded-frame strong")).toHaveText(
      "scan_result",
      { timeout: 20000 },
    );
    expect(calls.find((c) => c.path === "/api/scan").body).toEqual({
      scan_ms: 2500,
      exp_us: 300,
      dist: [400, 800],
      loose: false,
    });
    await page
      .getByRole("option", { name: "选择帧 sw2_e30", exact: true })
      .click();
    const startRecognizePolls = calls.filter((c) =>
      c.path.startsWith("/api/jobs/"),
    ).length;
    await nav(2);
    await expect(
      page.getByLabel("复用历史结果", { exact: true }),
    ).not.toBeChecked();
    await page.getByLabel("复用历史结果", { exact: true }).check();
    await btn("开始识别").click();
    await expect(page.locator(".recognition-actions .primary")).toBeDisabled();
    await nav(1);
    await expect(btn("开始采集").first()).toBeDisabled();
    await expect(status()).toContainText("识别完成", { timeout: 20000 });
    const rec = calls.find((c) => c.path === "/api/recognize");
    expect(rec.body).toMatchObject({
      frame: "sw2_e30",
      reuse_artifacts: true,
      voxel: 1.5,
      tile: 200,
      stride: 120,
      smooth_k: 16,
      smooth_r: 3,
      max_gap: 0.008,
      min_len: 50,
    });
    const times = calls
      .filter((c) => c.path.startsWith("/api/jobs/"))
      .slice(startRecognizePolls)
      .map((c) => c.time);
    expect(times[1] - times[0]).toBeGreaterThan(1200);
    await nav(2);
    await page.screenshot({ path: "screenshots/requirements-page-2.png" });
    simulate409 = true;
    await btn("开始识别").click();
    await expect(status()).toContainText("请稍候再试");
    simulate409 = false;
    await nav(3);
    await btn("保存标定").click();
    await expect(status()).toContainText("1.5mm");
    await expect(page.locator(".health")).toContainText("需复核");
    await page.screenshot({ path: "screenshots/requirements-page-3.png" });
    await btn("清除标定").click();
    await btn("确认清除").click();
    await expect(status()).toContainText("清除");
    await nav(4);
    await page.screenshot({ path: "screenshots/requirements-page-4.png" });
    await page.locator(".seam-list").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("option").filter({ hasText: "W002" }),
    ).toHaveAttribute("aria-selected", "true");
    await nav(5);
    await page.getByLabel("程序名称", { exact: true }).fill("bad-name");
    await btn("生成 .LS 程序").click();
    await expect(status()).toContainText("程序名");
    expect(calls.filter((c) => c.path === "/api/program")).toHaveLength(0);
    await page.getByLabel("程序名称", { exact: true }).fill("VALID");
    await btn("生成 .LS 程序").click();
    await expect(page.getByRole("dialog")).toContainText("禁止上机");
    await btn("确认生成").click();
    await expect(page.locator(".code-preview")).toBeVisible();
    await expect(page.locator(".right-column")).toContainText(
      "fixture advisory",
    );
    await page.getByLabel("播放速度", { exact: true }).selectOption("3");
    await expect(page.getByLabel("播放速度", { exact: true })).toHaveValue("3");
    await page.screenshot({ path: "screenshots/requirements-page-5.png" });
    const download = page.waitForEvent("download");
    await btn("下载 .LS").click();
    expect((await download).suggestedFilename()).toMatch(/\.ls$/i);
    await nav(6);
    await page.getByLabel("控制器地址", { exact: true }).fill("robot.fixture");
    await page.getByLabel("密码", { exact: true }).fill("do-not-persist");
    await btn("预览下发确认").click();
    await expect(page.getByRole("dialog")).toContainText("robot.fixture");
    await expect(page.getByRole("dialog")).toContainText("禁止上机");
    await expect(page.getByRole("dialog")).not.toContainText("do-not-persist");
    await btn("确认传输文件").click();
    await expect(status()).toContainText("字节");
    await btn("预览下发确认").click();
    await btn("确认传输文件").click();
    await expect(status()).toContainText("覆盖");
    expect(
      await page.evaluate(() => localStorage.getItem("weld-ftp-preferences")),
    ).not.toContain("do-not-persist");
    await page.screenshot({ path: "screenshots/requirements-page-6.png" });
    await nav(0);
    await page.screenshot({ path: "screenshots/requirements-page-0.png" });
    await btn("切换深浅主题").click();
    await page.screenshot({ path: "screenshots/requirements-home-dark.png" });
    await btn("切换深浅主题").click();
    await page
      .getByRole("button", { name: "任务中心", exact: false })
      .first()
      .click();
    await expect(page.locator(".task-drawer")).toBeVisible();
    expect(
      await page.locator(".task-drawer").evaluate((e) => e.clientHeight),
    ).toBe(238);
    await btn("收起任务中心").click();
    expect(errors).toEqual([]);
    console.log(
      "PASS: FR1–10 controlled HTTP fixture, full-screen/1366/compact layout, real upload worker, cache/local palette, validation, 202+1.5s polling+mutex+409, calibration residuals/clear, seam keyboard, program guard/advisory/download, playback controls, file-only FTP confirmation/overwrite/password, task history. Not a hardware or LAN-performance acceptance.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
