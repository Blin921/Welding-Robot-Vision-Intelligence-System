"use client";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  CloudUpload,
  Database,
  FileUp,
  Play,
  RefreshCcw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useWorkspace } from "../stores/provider";
import { validateScan } from "../lib/validation";
import { Busy, Field, Modal, Notice, Panel } from "./ui";
import type { Forms } from "./WorkflowControls";
export default function AcquisitionControls({
  forms,
  setForms,
  onNavigate,
}: {
  forms: Forms;
  setForms: Dispatch<SetStateAction<Forms>>;
  onNavigate: (tab: number) => void;
}) {
  const { state, store } = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false),
    [clear, setClear] = useState(false);
  const locked = Boolean(state.activeTask || state.pending);
  async function upload(files: FileList | null) {
    if (!files || locked) return;
    for (const file of Array.from(files)) await store.upload(file);
  }
  function number(key: "scan_ms" | "exp_us", value: string) {
    setForms((f) => ({
      ...f,
      scan: { ...f.scan, [key]: value === "" ? NaN : Number(value) },
    }));
  }
  function distance(index: number, value: string) {
    setForms((f) => ({
      ...f,
      scan: {
        ...f.scan,
        dist: f.scan.dist.map((v, i) =>
          i === index ? (value === "" ? NaN : Number(value)) : v,
        ) as [number, number],
      },
    }));
  }
  return (
    <>
      <Panel
        title="点云数据管理"
        icon={<Database />}
        className="acquisition-files"
      >
        <div
          className={`file-drop ${drag ? "drag-active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void upload(e.dataTransfer.files);
          }}
        >
          <CloudUpload size={28} />
          <strong>上传 PCD 点云</strong>
          <span>拖放文件或选择本地 PCD</span>
          <button
            className="primary wide"
            disabled={locked}
            onClick={() => input.current?.click()}
          >
            <FileUp size={17} />
            <Busy busy={state.pending === "upload"}>选择 PCD 文件</Busy>
          </button>
          <input
            ref={input}
            hidden
            type="file"
            accept=".pcd"
            multiple
            aria-label="上传 PCD 文件"
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <p className="hint">支持 .pcd，单文件上限 300MB；上传后无需刷新。</p>
        <div className="loaded-frame">
          <span>当前帧</span>
          <strong title={state.frame}>{state.frame || "未选择"}</strong>
          <button
            aria-label="卸载当前点云"
            disabled={locked || !state.frame}
            onClick={() => store.unloadFrame()}
          >
            <X size={17} />
          </button>
        </div>
        <div className="frame-list-tools">
          <strong>帧列表（{state.frames.length}）</strong>
          <button
            aria-label="刷新帧列表"
            disabled={locked}
            onClick={() => void store.restoreWorkspaceFrames()}
          >
            <RefreshCcw size={16} />
          </button>
          <button
            aria-label="清空工作区帧列表"
            disabled={locked || !state.frames.length}
            onClick={() => setClear(true)}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div
          className="acquisition-frame-list"
          role="listbox"
          aria-label="点云帧列表"
          tabIndex={0}
          onKeyDown={(e) => {
            if (
              !["ArrowUp", "ArrowDown"].includes(e.key) ||
              !state.frames.length ||
              locked
            )
              return;
            e.preventDefault();
            const at = state.frames.findIndex((f) => f.id === state.frame),
              next = Math.max(
                0,
                Math.min(
                  state.frames.length - 1,
                  at + (e.key === "ArrowDown" ? 1 : -1),
                ),
              );
            void store.selectFrame(state.frames[next].id);
          }}
        >
          {state.frames.map((frame) => (
            <button
              key={frame.id}
              role="option"
              aria-selected={state.frame === frame.id}
              aria-label={`选择帧 ${frame.id}`}
              disabled={Boolean(state.pending)}
              className={state.frame === frame.id ? "chosen" : ""}
              onClick={() => void store.selectFrame(frame.id)}
            >
              <i className="radio-dot" />
              <span>
                <strong>{frame.id}</strong>
                <small>
                  <b className={`source-${frame.source}`}>{frame.source}</b> ·{" "}
                  {(frame.bytes / 1048576).toFixed(1)} MB
                </small>
              </span>
              <em className={frame.has_artifacts ? "has-result" : "no-result"}>
                {frame.has_artifacts ? "有结果" : "待识别"}
              </em>
            </button>
          ))}
        </div>
        {!state.frames.length && (
          <div className="empty">
            <p>暂无点云帧</p>
            <button
              className="secondary"
              disabled={locked}
              onClick={() => input.current?.click()}
            >
              上传第一帧
            </button>
          </div>
        )}
        {state.frame && (
          <button
            className="secondary wide next-recognition"
            onClick={() => onNavigate(2)}
          >
            前往 AI 识别
          </button>
        )}
      </Panel>
      <Panel
        title="扫描采集设置"
        icon={<Settings2 />}
        className="acquisition-scan"
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const error = validateScan(forms.scan);
            if (error) store.notify(error, "error");
            else void store.run("scan", forms.scan);
          }}
        >
          <Field
            label="扫描时长"
            unit="ms"
            type="number"
            min={500}
            max={20000}
            step={1}
            value={
              Number.isFinite(forms.scan.scan_ms) ? forms.scan.scan_ms : ""
            }
            onChange={(v) => number("scan_ms", v)}
            disabled={locked}
          />
          <Field
            label="曝光时间"
            unit="μs"
            type="number"
            min={10}
            max={5000}
            step={1}
            value={Number.isFinite(forms.scan.exp_us) ? forms.scan.exp_us : ""}
            onChange={(v) => number("exp_us", v)}
            disabled={locked}
          />
          <div className="scan-distance">
            <span>工作距离 (mm)</span>
            <div>
              <input
                aria-label="工作距离下限"
                type="number"
                value={
                  Number.isFinite(forms.scan.dist[0]) ? forms.scan.dist[0] : ""
                }
                onChange={(e) => distance(0, e.target.value)}
                disabled={locked}
              />
              <span>—</span>
              <input
                aria-label="工作距离上限"
                type="number"
                value={
                  Number.isFinite(forms.scan.dist[1]) ? forms.scan.dist[1] : ""
                }
                onChange={(e) => distance(1, e.target.value)}
                disabled={locked}
              />
            </div>
          </div>
          <label className="switch-row">
            <span>散点输出 loose</span>
            <input
              aria-label="loose 模式"
              type="checkbox"
              checked={forms.scan.loose}
              disabled={locked}
              onChange={(e) =>
                setForms((f) => ({
                  ...f,
                  scan: { ...f.scan, loose: e.target.checked },
                }))
              }
            />
          </label>
          <p className="hint">
            采集与识别互斥；运行中等待后端结果，不提供取消。
          </p>
          {state.mode === "demo" && (
            <Notice>
              当前为浏览器自测，不连接相机；采集会返回未接相机提示。
            </Notice>
          )}
          <button className="primary wide" disabled={locked}>
            <Play size={17} />
            <Busy busy={state.activeTask?.kind === "scan"}>
              {state.activeTask ? "任务运行中" : "开始采集"}
            </Busy>
          </button>
        </form>
      </Panel>
      {clear && (
        <Modal title="清空工作区帧列表" onClose={() => setClear(false)}>
          <p>
            移除本次会话中的帧列表并卸载点云，不删除后端文件。可通过刷新恢复。
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setClear(false)}>
              保留列表
            </button>
            <button
              className="primary"
              onClick={() => {
                setClear(false);
                void store.removeFramesFromWorkspace(
                  state.frames.map((f) => f.id),
                );
              }}
            >
              确认清空
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
