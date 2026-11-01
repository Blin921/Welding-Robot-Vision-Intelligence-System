const { chromium, expect } = require("@playwright/test");
function blob(frame) {
  const b = Buffer.alloc(2086);
  const h = Buffer.from(
    JSON.stringify({
      version: 1,
      units: "mm",
      frame: "camera",
      frame_id: frame,
      n: 2,
      n_full: 2,
      source: "camera",
      center: [0, 0, 0],
      extent: [-50, -50, -50, 50, 50, 50],
      semantic_counts: { pipe: 2 },
      n_instances: 1,
      offsets: { xyz: 2052, rgb: 2076, instance: 2082 },
    }),
  );
  b.writeUInt32LE(h.length);
  h.copy(b, 4);
  [-50, 0, -50, 50, 0, 50].forEach((n, i) => b.writeFloatLE(n, 2052 + i * 4));
  b.fill(120, 2076, 2082);
  b.writeUInt16LE(1, 2082);
  b.writeUInt16LE(1, 2084);
  return b;
}
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1680, height: 944 } });
    let scanned = false,
      polls = 0;
    const calls = [],
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.route("**/api/**", async (r) => {
      const req = r.request(),
        path = new URL(req.url()).pathname;
      calls.push({
        path,
        method: req.method(),
        body: req.method() === "POST" ? req.postDataJSON() : null,
      });
      const json = (d, status = 200) =>
        r.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(d),
        });
      if (path === "/api/health")
        return json({ model_ok: true, model_error: null, cpp_ok: true });
      if (path === "/api/frames")
        return json({
          frames: [
            {
              id: "http_001",
              source: "dataset",
              bytes: 2000,
              mtime: 1,
              has_artifacts: true,
            },
            ...(scanned
              ? [
                  {
                    id: "http_scan",
                    source: "camera",
                    bytes: 2000,
                    mtime: 2,
                    has_artifacts: true,
                  },
                ]
              : []),
          ],
        });
      if (path.startsWith("/api/view/"))
        return r.fulfill({
          contentType: "application/octet-stream",
          body: blob(path.split("/").pop()),
        });
      if (path.startsWith("/api/seams/"))
        return json({
          frame: path.split("/").pop(),
          calib_tag: null,
          uncalibrated: true,
          seams: [],
          primitives: [],
        });
      if (path.startsWith("/api/calib/"))
        return json({ calib_tag: null, has_calib: false, uncalibrated: true });
      if (path === "/api/scan") return json({ job_id: "http-scan-job" }, 202);
      if (path === "/api/jobs/http-scan-job") {
        polls++;
        scanned = polls >= 2;
        return json({
          id: "http-scan-job",
          kind: "scan",
          state: scanned ? "done" : "running",
          log: scanned
            ? ["fixture scan started", "fixture scan completed"]
            : ["fixture scan started"],
          error: null,
          result: scanned ? { frame: "http_scan" } : null,
          seconds: polls,
        });
      }
      return json({ detail: "Unexpected " + path }, 404);
    });
    await p.goto(process.env.APP_URL || "http://localhost:3005");
    await p.locator("canvas").waitFor();
    const btn = (n) => p.getByRole("button", { name: n, exact: true });
    await btn("系统设置").click();
    await btn("真实后端").click();
    if (await btn("关闭弹窗").isVisible()) await btn("关闭弹窗").click();
    await expect(
      p.getByText("http_001.pcd", { exact: true }).first(),
    ).toBeVisible();
    await p.getByLabel("loose 模式", { exact: true }).check();
    await btn("开始采集").first().click();
    await expect(btn("采集进行中").first()).toBeDisabled();
    await expect(
      p.getByText("http_scan.pcd", { exact: true }).first(),
    ).toBeVisible({ timeout: 15000 });
    expect(calls.filter((c) => c.path === "/api/scan")).toEqual([
      {
        path: "/api/scan",
        method: "POST",
        body: { scan_ms: 2500, exp_us: 300, dist: [400, 800], loose: true },
      },
    ]);
    expect(polls).toBe(2);
    expect(errors).toEqual([]);
    await expect(btn("开始采集").first()).toBeEnabled();
    console.log(
      "PASS: HTTP contract fixture: exact scan parameters/202, mutex, polling, completion, frames refresh, selected result, no browser errors. This is not a hardware integration test.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
