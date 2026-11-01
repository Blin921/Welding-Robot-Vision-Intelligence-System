import { describe, expect, it, vi } from "vitest";
import { ApiError, errorMessage, HttpApi } from "../api";
import {
  DEFAULT_FTP,
  DEFAULT_PROGRAM,
  DEFAULT_RECOGNIZE,
  DEFAULT_SCAN,
  type Program,
} from "../types";
describe("same-origin API contracts", () => {
  it("uses binary PUT, JSON POST, all endpoint paths, and expects 202 jobs", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, init: init ?? {} });
        return new Response(JSON.stringify({ job_id: "j" }), {
          status: url === "/api/scan" || url === "/api/recognize" ? 202 : 200,
        });
      },
    );
    const api = new HttpApi(fetcher as typeof fetch);
    await api.health();
    await api.frames();
    const file = new Blob(["PCD"]);
    await api.upload("a b", file);
    await api.scan(DEFAULT_SCAN);
    await api.recognize({ ...DEFAULT_RECOGNIZE, frame: "f" });
    await api.job("j");
    await api.view("f");
    await api.seams("f");
    await api.calibration("f");
    await api.calibrate({
      frame: "f",
      matrix: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ],
    });
    await api.program({ ...DEFAULT_PROGRAM, frame: "f", seam_id: 2 });
    await api.push({ ...DEFAULT_FTP, frame: "f", seam_id: 2 });
    await api.download({ download: "/api/program/DEMO/download" } as Program);
    expect(calls.map((c) => c.url)).toEqual([
      "/api/health",
      "/api/frames",
      "/api/frames/a%20b",
      "/api/scan",
      "/api/recognize",
      "/api/jobs/j",
      "/api/view/f",
      "/api/seams/f",
      "/api/calib/f",
      "/api/calib",
      "/api/program",
      "/api/push",
      "/api/program/DEMO/download",
    ]);
    expect(calls[2].init).toMatchObject({
      method: "PUT",
      body: file,
      headers: { "Content-Type": "application/octet-stream" },
    });
    expect(JSON.parse(String(calls[10].init.body))).toEqual({
      ...DEFAULT_PROGRAM,
      frame: "f",
      seam_id: 2,
    });
    expect(calls[10].init.headers).toEqual({
      "Content-Type": "application/json",
    });
  });
  it("preserves backend error details, translates conflict and coordinate overflow", async () => {
    const api = new HttpApi(
      vi.fn(
        async () =>
          new Response(JSON.stringify({ detail: "FTP 连接失败" }), {
            status: 502,
          }),
      ) as typeof fetch,
    );
    await expect(
      api.push({ ...DEFAULT_FTP, frame: "f", seam_id: 1 }),
    ).rejects.toMatchObject({ status: 502, detail: "FTP 连接失败" });
    expect(errorMessage(new ApiError(409, "busy"))).toContain("稍候");
    expect(errorMessage(new ApiError(400, "坐标超出 ±5000mm"))).toContain(
      "请先完成标定",
    );
  });
  it("rejects cross-origin downloads and unexpected job status instead of faking success", async () => {
    const api = new HttpApi(
      vi.fn(async () => new Response("{}", { status: 200 })) as typeof fetch,
    );
    await expect(api.scan(DEFAULT_SCAN)).rejects.toThrow(/202/);
    await expect(
      api.download({ download: "https://evil.example/file" } as Program),
    ).rejects.toThrow(/非同源/);
  });
});

describe("browser fetch receiver", () => {
  it("does not invoke native fetch with the API client as its receiver", async () => {
    vi.stubGlobal("fetch", function (this: unknown) {
      expect(this).not.toBeInstanceOf(HttpApi);
      return Promise.resolve(new Response("{}"));
    });
    try {
      await new HttpApi().health();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
