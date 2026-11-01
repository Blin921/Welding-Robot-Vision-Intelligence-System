"use client";
import dynamic from "next/dynamic";
import {
  Activity,
  Box,
  Expand,
  Focus,
  FolderOpen,
  Layers3,
  LoaderCircle,
  Move3D,
  RotateCcw,
} from "lucide-react";
import { useRef, useState } from "react";
import { useWorkspace } from "../stores/provider";
import { Notice, Panel } from "./ui";
import { Playback, usePlayback } from "./Playback";
const Cloud = dynamic(() => import("./PointCloud"), {
  ssr: false,
  loading: () => (
    <div className="cloud-loading">
      <LoaderCircle className="spin" />
      加载三维渲染器
    </div>
  ),
});
export default function WorkspaceViewport({
  tab,
  light,
  onNavigate,
}: {
  tab: number;
  light: boolean;
  onNavigate: (tab: number) => void;
}) {
  const { state } = useWorkspace();
  return (
    <Viewport
      key={state.frame}
      tab={tab}
      light={light}
      onNavigate={onNavigate}
    />
  );
}
function Viewport({
  tab,
  light,
  onNavigate,
}: {
  tab: number;
  light: boolean;
  onNavigate: (tab: number) => void;
}) {
  const { state, store } = useWorkspace();
  const [mode, setMode] = useState<"语义" | "实例">("语义"),
    [size, setSize] = useState(2),
    [grid, setGrid] = useState(true),
    [reset, setReset] = useState(0);
  const viewer = useRef<HTMLDivElement>(null);
  const generated = store.currentProgram(),
    playback = usePlayback(generated?.data ?? null, tab === 5),
    cloud = state.cloud,
    push = store.currentPush();
  const headings = [
    "",
    "三维点云预览",
    "三维语义识别结果",
    "标定点云与坐标系",
    "多构件点云视图",
    "轨迹预演",
    "点云与轨迹视图",
  ];
  const colors =
    mode === "语义"
      ? [
          ["#4682e6", "钢管"],
          ["#32c850", "钢筋"],
          ["#b432b4", "扁钢"],
          ["#b4b4b4", "背景"],
        ]
      : [
          ["#efbd66", "实例 · 黄金率配色"],
          ["#41464e", "未分派 / 背景 (0)"],
        ];
  return (
    <>
      <div className="viewer panel" ref={viewer}>
        <div className="viewer-heading">
          <span>
            <Box size={17} />
            {headings[tab]}
          </span>
          <span className="viewport-label">
            <i /> REALTIME VIEWPORT
          </span>
        </div>
        <div className="viewer-toolbar">
          <div className="segmented">
            {(["语义", "实例"] as const).map((value) => (
              <button
                key={value}
                className={mode === value ? "active" : ""}
                onClick={() => setMode(value)}
              >
                {value === "语义" ? <Layers3 size={13} /> : <Box size={13} />}{" "}
                {value}
              </button>
            ))}
          </div>
          <button
            className={`toolbar-grid ${grid ? "on" : ""}`}
            onClick={() => setGrid(!grid)}
            aria-pressed={grid}
          >
            <Focus size={14} />
            网格
          </button>
          <div className="point-size">
            点大小
            <input
              aria-label="点大小"
              type="range"
              min="1"
              max="6"
              step="1"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
            <span>{size}</span>
          </div>
          <button
            aria-label="重置视角"
            title="按点云范围重置视角"
            onClick={() => setReset((r) => r + 1)}
          >
            <RotateCcw size={15} />
          </button>
          <button
            aria-label="全屏视图"
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await viewer.current?.requestFullscreen();
              } catch {
                store.notify("浏览器未允许全屏显示", "warn");
              }
            }}
          >
            <Expand size={16} />
          </button>
        </div>
        <div className="main-cloud">
          {state.loading ? (
            <div className="cloud-loading">
              <LoaderCircle className="spin" />
              正在加载点云、焊缝与标定状态
            </div>
          ) : cloud ? (
            <Cloud
              cloud={cloud}
              seams={state.seams}
              selected={state.selected}
              light={light}
              mode={mode}
              size={size}
              reset={reset}
              grid={grid}
              tcp={tab === 5 ? playback.pose : null}
              tcpPath={generated?.data.waypoints_cam_mm}
            />
          ) : (
            <div className="empty">
              <FolderOpen size={40} />
              <h3>{state.loadError ? "数据加载失败" : "等待点云识别结果"}</h3>
              <p>
                {state.loadError ??
                  "当前帧无历史结果，请开始识别或选择有结果的帧。"}
              </p>
              <button
                className="primary"
                onClick={() =>
                  state.loadError ? void store.retry() : onNavigate(2)
                }
              >
                {state.loadError ? "重试加载" : "前往识别"}
              </button>
            </div>
          )}
          {cloud && (
            <>
              <div className="view-corner-label">
                <span className="live-dot" />
                {state.frame}
                <small>CAMERA COORDINATES / mm</small>
              </div>
              <div className="legend">
                <small>{mode === "语义" ? "语义标签" : "实例着色"}</small>
                {colors.map(([c, label]) => (
                  <span key={label}>
                    <i style={{ background: c }} />
                    {label}
                  </span>
                ))}
                <span className="legend-line">选中焊缝</span>
              </div>
              <div className="axis-widget">
                <Move3D />
                <b className="axis-x">X</b>
                <b className="axis-y">Y</b>
                <b className="axis-z">Z</b>
              </div>
              <div className="viewer-hint">
                拖动旋转 <span>·</span> 滚轮缩放 <span>·</span> 网格 10mm
              </div>
            </>
          )}
          {tab === 5 && playback.pose && (
            <div className="tcp-readout">
              <span>
                TCP{" "}
                <b>
                  {playback.pose.position.map((v) => v.toFixed(1)).join(" / ")}{" "}
                  mm
                </b>
              </span>
              <span>
                WPR <b>{playback.pose.wpr.join(" / ")}°</b>
              </span>
            </div>
          )}
        </div>
        {tab === 5 && (
          <>
            <Playback
              playback={playback}
              enabled={Boolean(generated && cloud && playback.timeline.length)}
            />
            {!generated && (
              <div className="playback-guide">
                请先生成当前焊缝的程序；预演只使用返回的相机系途经点和 WPR。
              </div>
            )}
          </>
        )}
        <div className="viewport-status">
          <span>
            <i className={state.mode === "demo" ? "yellow" : "green"} />
            {state.mode === "demo" ? "模拟点云" : "后端点云"}
          </span>
          <span>
            显示点数 <b>{cloud?.header.n.toLocaleString() ?? "—"}</b>
            <small> / {cloud?.header.n_full.toLocaleString() ?? "—"}</small>
          </span>
          <span>
            实例 <b>{cloud?.header.n_instances ?? "—"}</b>
          </span>
          <span>
            来源 <b>{cloud?.header.source ?? "—"}</b>
          </span>
          <span className="status-fps">
            mm <Activity size={12} />
          </span>
        </div>
      </div>
      {state.loadError && cloud && (
        <Notice warning>部分数据未能加载：{state.loadError}</Notice>
      )}
      {tab === 5 && generated && (
        <div className="program-coordinate-grid">
          <div>
            <strong>相机系途经点 · 用于预演</strong>
            <p className="mono">
              {generated.data.waypoints_cam_mm.length} 个点
            </p>
          </div>
          <div>
            <strong>基座系途经点 · 与 .LS 一致</strong>
            <p className="mono">
              {generated.data.waypoints_base_mm.length} 个点
            </p>
          </div>
          <details>
            <summary>查看基座系坐标</summary>
            <pre>
              {generated.data.waypoints_base_mm
                .map(
                  (p, i) =>
                    `${i + 1}: ${p.map((v) => v.toFixed(3)).join(", ")}`,
                )
                .join("\n")}
            </pre>
          </details>
        </div>
      )}
      {tab === 6 && (
        <Panel title="文件与传输结果" icon={<Box />}>
          <div className="transfer-result">
            <Box size={30} />
            <div>
              <strong>
                {generated
                  ? /\.ls$/i.test(generated.data.ls_name)
                    ? generated.data.ls_name
                    : `${generated.data.ls_name}.ls`
                  : "尚未生成当前焊缝程序"}
              </strong>
              <p>
                {push
                  ? `${state.mode === "demo" ? "模拟传输结果" : "传输结果"}：${push.bytes} 字节 → ${push.remote_path}`
                  : generated
                    ? "文件已就绪，确认目标后可下发"
                    : "请先生成程序，再预览下发流程"}
              </p>
            </div>
            <button className="secondary" onClick={() => onNavigate(5)}>
              前往程序预览
            </button>
          </div>
          {push?.existed_before && (
            <Notice warning>
              已覆盖控制器同名程序{state.mode === "demo" ? "（模拟）" : ""}
            </Notice>
          )}
        </Panel>
      )}
    </>
  );
}
