import { describe, it, expect } from "vitest";
import { AcquisitionDemoApi } from "../acquisition/api";
import { demoCloud, demoSeams } from "../demo-data";
import { parseView } from "../blob";
describe("layout-only acquisition data", () => {
  it("uses the same original point buffer and seams as the other pages", async () => {
    const api = new AcquisitionDemoApi();
    const buffer = await api.view("frame_001");
    expect(buffer).toBe(demoCloud());
    expect(parseView(buffer).header.n).toBe(200000);
    expect(parseView(buffer).header.source).toBe("demo");
    expect((await api.seams("frame_001")).seams).toEqual(demoSeams());
  });
});
