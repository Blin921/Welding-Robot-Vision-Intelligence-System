import { encodeView } from "./view-buffer";
/** Visible samples reconstructed from the supplied reference image, not the missing original PCD. */
export function referenceCloud(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  frame: string,
): ArrayBuffer {
  if (width !== 1680 || height !== 944 || pixels.length !== width * height * 4)
    throw new Error("参考图尺寸应为 1680×944");
  const positions: number[] = [],
    colors: number[] = [],
    ids: number[] = [];
  for (let y = 203; y < 748; y++)
    for (let x = 412; x < 1203; x++) {
      if (x < 514 && y > 690) continue;
      const offset = (y * width + x) * 4,
        r = pixels[offset],
        g = pixels[offset + 1],
        b = pixels[offset + 2],
        max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      if (!((max - min > 38 && max > 90) || r + g + b < 620)) continue;
      let id = 0,
        depth = (y - 470) * 0.25;
      const band = Math.max(
        0,
        Math.min(3, Math.floor(((x - 412) * 0.45 + y - 203 - 120) / 85)),
      );
      if (b > r * 1.18 && b > g * 1.04) {
        id = band + 1;
        depth += 70 + 20 * Math.sin((x + y) * 0.02);
      } else if (g > r * 1.12 && g > b * 1.05) {
        id = 5 + band;
        depth += 50;
      } else if (r > g * 1.2 && b > g * 1.15) {
        id = 9;
        depth += 10;
      }
      positions.push(x - 404 + 0.5, y - 194 + 0.5, depth);
      colors.push(r, g, b);
      ids.push(id);
    }
  const count = 286742,
    available = ids.length;
  if (!available) throw new Error("参考图未提取到点云");
  const xyz = new Float32Array(count * 3),
    rgb = new Uint8Array(count * 3),
    instance = new Uint16Array(count);
  for (let i = 0; i < count; i++) {
    const p = i < available ? i : (i * 7919) % available;
    xyz.set(positions.slice(p * 3, p * 3 + 3), i * 3);
    rgb.set(colors.slice(p * 3, p * 3 + 3), i * 3);
    instance[i] = ids[p];
  }
  return encodeView(xyz, rgb, instance, {
    frame,
    source: "reference-image",
    nFull: count,
    center: [403, 323, 0],
    extent: [0, 0, -160, 806, 646, 160],
  });
}
let cache: Promise<ArrayBuffer> | null = null;
export function loadReferenceView(): Promise<ArrayBuffer> {
  if (cache) return cache;
  cache = (async () => {
    const response = await fetch("/acquisition/reference.jpg");
    if (!response.ok) throw new Error("参考素材读取失败");
    const bitmap = await createImageBitmap(await response.blob(), {
      colorSpaceConversion: "none",
    });
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height),
      context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("浏览器不支持点云示例解码");
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return referenceCloud(
      context.getImageData(0, 0, canvas.width, canvas.height).data,
      canvas.width,
      canvas.height,
      "frame_001",
    );
  })().catch((error) => {
    cache = null;
    throw error;
  });
  return cache;
}
export function renameView(buffer: ArrayBuffer, frame: string) {
  const output = buffer.slice(0),
    view = new DataView(output),
    header = JSON.parse(
      new TextDecoder().decode(
        new Uint8Array(output, 4, view.getUint32(0, true)),
      ),
    );
  header.frame_id = frame;
  const bytes = new TextEncoder().encode(JSON.stringify(header));
  if (bytes.length > 2048) throw new Error("帧名过长");
  view.setUint32(0, bytes.length, true);
  new Uint8Array(output, 4, 2048).fill(0);
  new Uint8Array(output, 4, bytes.length).set(bytes);
  return output;
}
