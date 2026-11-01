const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn, execFile } = require("node:child_process");
let server;
async function freePort() {
  for (let port = 3000; port <= 3010; port++) {
    const free = await new Promise((resolve) => {
      const probe = net.createServer();
      probe.once("error", () => resolve(false));
      probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
    });
    if (free) return port;
  }
  throw Error(
    "Ports 3000-3010 are occupied. Close an older instance and retry.",
  );
}
function openBrowser(url) {
  if (process.env.WELD_NO_OPEN === "1" || process.argv.includes("--no-open"))
    return;
  const command =
    process.platform === "win32"
      ? process.env.ComSpec || "cmd.exe"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `start "" "${url}"`]
      : [url];
  execFile(command, args, (error) => {
    if (error) console.log(`Open ${url} in your browser.`);
  });
}
async function main() {
  if (Number(process.versions.node.split(".")[0]) < 24)
    throw Error("Install Node.js 24 LTS or newer: https://nodejs.org/");
  const runtime = path.join(__dirname, "runtime"),
    entry = path.join(runtime, "server.js");
  if (
    !fs.existsSync(entry) ||
    !fs.existsSync(path.join(runtime, "node_modules", "next", "package.json"))
  )
    throw Error(
      "Extract the complete WeldVision-Acquisition-v3.zip first. The runtime folder is required.",
    );
  const port = await freePort(),
    url = `http://127.0.0.1:${port}`;
  console.log(
    "WeldVision Acquisition v0.3.0 - prebuilt Next.js production runtime.",
  );
  console.log("No npm install and no compilation required.");
  server = spawn(process.execPath, [entry], {
    cwd: runtime,
    stdio: "inherit",
    env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
  });
  let ended = false;
  const exit = new Promise((resolve, reject) => {
    server.once("error", reject);
    server.once("exit", (code) => {
      ended = true;
      resolve(code || 0);
    });
  });
  let ready = false;
  const start = Date.now();
  while (!ended && Date.now() - start < 30000) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* server startup */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!ready) {
    server.kill();
    throw Error("Could not start the server. See the output above.");
  }
  console.log(
    `\nREADY: ${url} (${Date.now() - start} ms)\nKeep this window open. Ctrl+C stops the app.\n`,
  );
  openBrowser(url);
  process.exitCode = await exit;
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    if (server) server.kill(signal);
    else process.exit(0);
  });
main().catch((e) => {
  console.error(e.message);
  if (server) server.kill();
  process.exitCode = 1;
});
