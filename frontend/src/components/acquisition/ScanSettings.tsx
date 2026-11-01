"use client";
import { Play, Settings2 } from "lucide-react";
import type { ScanRequest } from "../../lib/types";
import { validateScan } from "../../lib/validation";
import { useWorkspace } from "../../stores/provider";
import { Busy, Field, Notice, Panel } from "../ui";

export default function ScanSettings({ value, onChange }: { value: ScanRequest; onChange: (value: ScanRequest) => void }) {
  const { state, store } = useWorkspace();
  const locked = Boolean(state.activeTask || state.pending);
  const numeric = (text: string) => text.trim() === "" ? NaN : Number(text);
  function distance(index: 0 | 1, text: string) {
    const dist: [number, number] = [...value.dist];
    dist[index] = numeric(text);
    onChange({ ...value, dist });
  }
  return <Panel title="扫描采集设置" icon={<Settings2 />} className="acquisition-scan">
    <form noValidate onSubmit={(event) => {
      event.preventDefault();
      if (locked) return;
      const error = validateScan(value);
      if (error) store.notify(error, "error"); else void store.run("scan", value);
    }}>
      <Field label="扫描时长" unit="ms" type="number" min={500} max={20000} step={1} value={value.scan_ms}
        disabled={locked} onChange={(text) => onChange({ ...value, scan_ms: numeric(text) })} />
      <Field label="曝光时间" unit="μs" type="number" min={10} max={5000} step={1} value={value.exp_us}
        disabled={locked} onChange={(text) => onChange({ ...value, exp_us: numeric(text) })} />
      <div className="acquisition-distance"><span>工作距离 (mm)</span><div>
        <Field label="工作距离下限" type="number" value={value.dist[0]} disabled={locked} onChange={(text) => distance(0, text)} />
        <span aria-hidden="true">—</span>
        <Field label="工作距离上限" type="number" value={value.dist[1]} disabled={locked} onChange={(text) => distance(1, text)} />
      </div></div>
      <label className="switch-row"><span>散点输出 loose</span><input aria-label="loose 模式" type="checkbox" checked={value.loose}
        disabled={locked} onChange={(event) => onChange({ ...value, loose: event.target.checked })} /></label>
      <p className="hint">采集与识别互斥；运行中等待后端结果，不提供取消。</p>
      {state.mode === "demo" && <Notice>当前为浏览器自测，不连接相机；采集会返回未接相机提示。</Notice>}
      <button type="submit" className="primary wide" disabled={locked}><Play size={16} />
        <Busy busy={state.activeTask?.kind === "scan"}>{state.activeTask ? "任务运行中" : "开始采集"}</Busy></button>
    </form>
  </Panel>;
}
