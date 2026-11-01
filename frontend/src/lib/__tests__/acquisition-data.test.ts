import { describe, it, expect } from "vitest";
import { AcquisitionDemoApi } from "../acquisition/api";
import { demoCloud, demoSeams } from "../demo-data";
import { parseView } from "../blob";
describe("layout-only acquisition data", () => {
  it("retains missing-artifact guidance rather than fabricating results", async () => {
    const api = new AcquisitionDemoApi();
    await expect(api.view("frame_003")).rejects.toThrow("无识别结果");
    await expect(api.seams("frame_003")).rejects.toThrow("无识别结果");
  });
  it("uses the same original point buffer and seams as the other pages", async () => {
    const api = new AcquisitionDemoApi();
    const buffer = await api.view("sw2_e30");
    expect(buffer).toBe(demoCloud());
    expect(parseView(buffer).header.n).toBe(200000);
    expect(parseView(buffer).header.source).toBe("demo");
    expect((await api.seams("sw2_e30")).seams).toEqual(demoSeams());
  });
});
