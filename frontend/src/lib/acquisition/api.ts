import { DemoApi } from "../demo-api";
import { ApiError, HttpApi } from "../api";
import { parsePcdFile } from "./parse-file";
export class AcquisitionDemoApi extends DemoApi {
  private previews = new Map<string, ArrayBuffer>();
  override async upload(frame: string, file: Blob) {
    const buffer = await parsePcdFile(file, frame);
    const result = await super.upload(frame, file);
    this.previews.set(frame, buffer);
    return result;
  }
  override async view(frame: string) {
    const preview = this.previews.get(frame);
    if (preview) return preview;
    return super.view(frame);
  }
  override async seams(frame: string) {
    if (!this.previews.has(frame)) return super.seams(frame);
    const status = await this.calibration(frame);
    return {
      frame,
      calib_tag: status.calib_tag,
      uncalibrated: status.uncalibrated,
      seams: [],
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
