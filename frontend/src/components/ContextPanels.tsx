"use client";
import {
  Activity,
  ArrowDownToLine,
  Check,
  Code2,
  Copy,
  Crosshair,
  FileCode2,
  Layers3,
  Play,
  ShieldCheck,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { useWorkspace } from "../stores/provider";
import { Notice, Panel } from "./ui";
import SeamList, { seamLabel } from "./SeamList";
const xyz = (v: number[] | undefined) =>
  v?.map((n) => n.toFixed(1)).join(", ") ?? "—";
export default function ContextPanels({
  tab,
  minLength,
  onAction,
  onTaskOpen,
  onNavigate,
}: {
  tab: number;
  minLength: number;
  onAction: (
    action: "view" | "preview" | "program" | "push",
    id: number,
  ) => void;
  onTaskOpen: () => void;
  onNavigate: (tab: number) => void;
}) {
  const { store, state } = useWorkspace();
  const program = store.currentProgram(),
    seam = state.seams.find((s) => s.id === state.selected),
    calib = state.calibration,
    cloud = state.cloud;
  return (
    <>
      {tab === 3 ? (
        <>
          <Panel title="标定状态" icon={<ShieldCheck />}>
            <div
              className={`calibration-state ${calib?.has_calib ? "done" : ""}`}
            >
              {calib?.has_calib ? <Check /> : <TriangleAlert />}
              <strong>
                {calib?.has_calib
                  ? "标定已保存"
                  : calib
                    ? "当前帧未标定"
                    : "标定状态未知"}
              </strong>
            </div>
            <div className="stats">
              <div>
                <small>最大残差</small>
                <strong className="smaller">
                  {calib?.max_dev_mm?.toFixed(2) ?? "—"}
                  <span>mm</span>
                </strong>
              </div>
              <div>
                <small>平均残差</small>
                <strong className="smaller">
                  {calib?.mean_dev_mm?.toFixed(2) ?? "—"}
                  <span>mm</span>
                </strong>
              </div>
            </div>
            <div className="calib-tag">
              calib_tag <code>{calib?.calib_tag ?? "未标定"}</code>
            </div>
            {(calib?.max_dev_mm ?? 0) > 1.5 && (
              <Notice warning>
                最大残差超过 1.5mm，点对配准误差偏大，请复核点对与精度。
              </Notice>
            )}
            {calib?.has_calib && calib.max_dev_mm === undefined && (
              <Notice>当前接口未提供点对残差，不能据此判断标定精度。</Notice>
            )}
          </Panel>
          <Panel title="坐标与标定约定" icon={<Crosshair />}>
            <p className="context-description">
              标定按帧独立保存。点对不少于 3 组；矩阵输入为 4×4
              齐次矩阵。标定成功后需重新生成程序。
            </p>
            <Notice>
              视图始终使用相机系毫米坐标，并统一显示为 (x, −y, z)。
            </Notice>
          </Panel>
        </>
      ) : tab === 5 ? (
        <Panel
          title="程序预览"
          icon={<Code2 />}
          extra={
            <span className="badge">
              {state.mode === "demo" ? "演示文本" : "后端输出"}
            </span>
          }
        >
          <div className="code-caption">
            <span>
              <i className="yellow" />
              {program?.data.ls_name ?? "等待生成"}
            </span>
            <span>FANUC LS</span>
          </div>
          {program ? (
            <>
              {program.uncalibrated && (
                <Notice warning>坐标仍是相机系，禁止上机</Notice>
              )}
              {program.data.issues.length > 0 && (
                <div className="issues">
                  <strong>规范提示 · advisory，不阻断生成</strong>
                  <ul>
                    {program.data.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              <pre className="code-preview" aria-label="LS 程序文本">
                {program.data.ls_text.split("\n").map((line, i) => (
                  <div key={i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {line}
                  </div>
                ))}
              </pre>
              <div className="two-buttons">
                <button
                  className="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(program.data.ls_text);
                      store.notify("程序文本已复制");
                    } catch {
                      store.notify(
                        "浏览器未允许剪贴板访问，可从文本预览中选择复制",
                        "error",
                      );
                    }
                  }}
                >
                  <Copy size={14} />
                  复制
                </button>
                <button
                  className="secondary"
                  onClick={() => void store.download()}
                >
                  <ArrowDownToLine size={14} />
                  下载 .LS
                </button>
              </div>
            </>
          ) : (
            <div className="empty">
              <FileCode2 size={36} />
              <p>等待生成程序</p>
              <small>选择焊缝并填写参数，生成后可查看文本与 TCP 预演。</small>
            </div>
          )}
          <Notice>程序选择与启动由操作者在示教器上人工确认。</Notice>
        </Panel>
      ) : (
        <>
          <Panel
            title={tab === 6 ? "当前帧信息" : "识别结果概览"}
            icon={<Activity />}
          >
            <div className="stats">
              <div>
                <small>焊缝数量</small>
                <strong>
                  {state.seams.length.toString().padStart(2, "0")}
                  <span>条</span>
                </strong>
              </div>
              <div>
                <small>点云总数</small>
                <strong className="smaller">
                  {cloud?.header.n.toLocaleString() ?? "—"}
                </strong>
              </div>
            </div>
            <div className="metrics">
              <div>
                <span>总焊缝长度</span>
                <strong>
                  {state.seams
                    .reduce((sum, s) => sum + s.length_mm, 0)
                    .toFixed(1)}
                  <small> mm</small>
                </strong>
              </div>
              <div>
                <span>实例数量</span>
                <strong>{cloud?.header.n_instances ?? "—"}</strong>
              </div>
              <div>
                <span>坐标系</span>
                <span className="pill">相机系</span>
              </div>
            </div>
          </Panel>
          <Panel
            title={
              tab === 6
                ? "任务状态"
                : tab === 4
                  ? "焊缝几何详情"
                  : "焊缝选择与属性"
            }
            icon={<Layers3 />}
            extra={
              seam ? (
                <span className="count">{seamLabel(seam.id)}</span>
              ) : undefined
            }
          >
            {tab === 6 ? (
              <div className="steps">
                {["点云载入", "焊缝识别", "程序生成", "文件传输"].map(
                  (label, i) => (
                    <div key={label}>
                      <i
                        className={
                          (i < 2 && cloud) ||
                          (i === 2 && program) ||
                          (i === 3 && store.currentPush())
                            ? "green"
                            : ""
                        }
                      />
                      <span>{label}</span>
                      <small>
                        {(i < 2 && cloud) ||
                        (i === 2 && program) ||
                        (i === 3 && store.currentPush())
                          ? "已完成"
                          : "未开始"}
                      </small>
                    </div>
                  ),
                )}
                <Notice warning>
                  仅传输程序文件。T1 倍率不高于 10%，单段模式，手不离急停。
                </Notice>
              </div>
            ) : tab === 2 ? (
              <SeamList minLength={minLength} onAction={onAction} />
            ) : seam ? (
              <>
                <div className="detail-thumbnail">
                  <div className="mini-pipe" />
                  <div className="mini-seam" />
                  <span>SEAM / {seamLabel(seam.id)}</span>
                </div>
                <div className="detail-title">
                  <strong>{seam.shape}</strong>
                  <span className="result-badge">已选择</span>
                </div>
                <div className="metrics">
                  <div>
                    <span>拓扑类型</span>
                    <strong>{seam.type}</strong>
                  </div>
                  <div>
                    <span>焊缝长度</span>
                    <strong>
                      {seam.length_mm.toFixed(1)} <small>mm</small>
                    </strong>
                  </div>
                  <div>
                    <span>起点 XYZ</span>
                    <strong className="coordinate">
                      {xyz(seam.trajectory_mm[0])}
                    </strong>
                  </div>
                  <div>
                    <span>终点 XYZ</span>
                    <strong className="coordinate">
                      {xyz(seam.trajectory_mm.at(-1))}
                    </strong>
                  </div>
                  <div>
                    <span>轨迹点数</span>
                    <strong>{seam.trajectory_mm.length}</strong>
                  </div>
                </div>
                <div className="two-buttons">
                  <button
                    className="secondary"
                    onClick={() => onAction("preview", seam.id)}
                  >
                    <Play size={14} />
                    预演
                  </button>
                  <button
                    className="secondary"
                    onClick={() => onAction("program", seam.id)}
                  >
                    <FileCode2 size={14} />
                    生成 .LS
                  </button>
                </div>
              </>
            ) : (
              <div className="empty">
                <Layers3 />
                <p>当前没有选中焊缝</p>
                <button onClick={() => onNavigate(2)}>前往识别</button>
              </div>
            )}
          </Panel>
        </>
      )}
      <Panel
        title="任务日志"
        icon={<Terminal />}
        extra={
          <button className="subtle-button" onClick={onTaskOpen}>
            查看全部
          </button>
        }
        className="logs-panel"
      >
        <div className="log-list">
          {state.logs.slice(0, 4).map((log) => (
            <div className="log" key={log.id}>
              <i
                className={
                  log.kind === "error"
                    ? "red"
                    : log.kind === "warn"
                      ? "yellow"
                      : log.kind === "info"
                        ? "blue"
                        : "green"
                }
              />
              <time>{log.time}</time>
              <span>{log.text}</span>
            </div>
          ))}
          {state.logs.length === 0 && (
            <p className="hint">暂无操作日志，任务开始后会实时显示。</p>
          )}
        </div>
      </Panel>
    </>
  );
}
