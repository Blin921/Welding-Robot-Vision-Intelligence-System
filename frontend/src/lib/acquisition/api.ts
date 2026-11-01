import { DemoApi } from "../demo-api";
import { ApiError, HttpApi } from "../api";
import { parsePcdFile } from "./parse-file";
import { demoCloud, demoSeams } from "../demo-data";
import type { Frame } from "../types";
export const ACQUISITION_FRAMES: Frame[] = [
  "dataset",
  "camera",
  "upload",
  "dataset",
  "camera",
].map((source, i) => ({
  id: `frame_${String(i + 1).padStart(3, "0")}`,
  source: source as Frame["source"],
  bytes: 12400000 - i * 97000,
  mtime: 1761984000 - i * 120,
  has_artifacts: true,
}));
export class AcquisitionDemoApi extends DemoApi {
  private previews = new Map<string, ArrayBuffer>();
  constructor() {
    super();
    this.frameData = ACQUISITION_FRAMES.map((frame) => ({ ...frame }));
  }
  override async upload(frame: string, file: Blob) {
    const buffer = await parsePcdFile(file, frame);
    const result = await super.upload(frame, file);
    this.previews.set(frame, buffer);
    return result;
  }
  override async view(frame: string) {
    const preview = this.previews.get(frame);
    if (preview) return preview;
    if (!this.frameData.some((f) => f.id === frame))
      throw new ApiError(404, "帧不存在");
    return demoCloud();
  }
  override async seams(frame: string) {
    const status = await this.calibration(frame);
    return {
      frame,
      calib_tag: status.calib_tag,
      uncalibrated: status.uncalibrated,
      seams: this.previews.has(frame) ? [] : demoSeams(),
      primitives: [],
    };
  }
}
/** Real backend remains authoritative. Raw previews are a local fallback until recognition exists. */
export class AcquisitionHttpApi extends HttpApi {
  private previews = new Map<string, ArrayBuffer>();
  override async upload(frame: string, file: Blob) {
    const preview = await parsePcdFile(file, frame);
    const result = await super.upload(frame, file);
    this.previews.set(result.id, preview);
    return result;
  }
  override async view(frame: string, signal?: AbortSignal) {
    try {
      return await super.view(frame, signal);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 404 &&
        this.previews.has(frame)
      )
        return this.previews.get(frame)!;
      throw error;
    }
  }
}

