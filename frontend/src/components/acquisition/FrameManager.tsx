"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, CloudUpload, Database, FileUp, RefreshCcw, Trash2, X } from "lucide-react";
import { useWorkspace } from "../../stores/provider";
import { Busy, Modal, Panel } from "../ui";

export default function FrameManager({ onNavigate }: { onNavigate: (tab: number) => void }) {
  const { state, store } = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const locked = Boolean(state.activeTask || state.pending || uploadingFiles);

  async function upload(files: File[]) {
    if (locked || uploading.current || !files.length) return;
    uploading.current = true;
    setUploadingFiles(true);
    try {
      for (const file of files) await store.upload(file);
    } finally {
      uploading.current = false;
      setUploadingFiles(false);
    }
  }
  function selectWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (locked || !state.frames.length) return;
    const keys = ["ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = state.frames.findIndex((frame) => frame.id === state.frame);
    const index = event.key === "Home" ? 0 : event.key === "End" ? state.frames.length - 1
      : Math.max(0, Math.min(state.frames.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)));
    void store.selectFrame(state.frames[index].id);
  }
  return <Panel title="点云数据管理" icon={<Database />} className="acquisition-files">
    <div className={`file-drop ${dragging && !locked ? "drag-active" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); dragDepth.current += 1; if (!locked) setDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = locked ? "none" : "copy"; }}
      onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); dragDepth.current = 0; setDragging(false); void upload(Array.from(event.dataTransfer.files)); }}>
      <CloudUpload size={26} aria-hidden="true" />
      <strong>上传 PCD 点云</strong>
      <span>拖放文件或选择本地 PCD</span>
      <button className="primary wide" disabled={locked} onClick={() => input.current?.click()}>
        <FileUp size={16} /><Busy busy={uploadingFiles || state.pending === "upload"}>选择 PCD 文件</Busy>
      </button>
      <input ref={input} hidden type="file" accept=".pcd" multiple aria-label="上传 PCD 文件" disabled={locked}
        onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void upload(files); }} />
    </div>
    <p className="hint">支持 .pcd，单文件上限 300MB；上传后无需刷新。</p>
    <div className="loaded-frame"><span>当前帧</span><strong title={state.frame}>{state.frame || "未选择"}</strong>
      <button title="卸载当前点云" aria-label="卸载当前点云" disabled={locked || !state.frame} onClick={() => store.unloadFrame()}><X size={16} /></button>
    </div>
    <div className="frame-list-tools"><strong>帧列表（{state.frames.length}）</strong>
      <button title="刷新帧列表" aria-label="刷新帧列表" disabled={locked} onClick={() => void store.restoreWorkspaceFrames()}><RefreshCcw size={16} /></button>
      <button title="清空工作区帧列表" aria-label="清空工作区帧列表" disabled={locked || !state.frames.length} onClick={() => setConfirmClear(true)}><Trash2 size={16} /></button>
    </div>
    <div className="acquisition-frame-list" role="listbox" aria-label="点云帧列表" aria-busy={uploadingFiles || Boolean(state.pending)} tabIndex={0} onKeyDown={selectWithKeyboard}>
      {state.frames.map((frame) => <button key={frame.id} role="option" aria-selected={state.frame === frame.id}
        aria-label={`选择帧 ${frame.id}`} disabled={locked} className={state.frame === frame.id ? "chosen" : ""}
        onClick={() => void store.selectFrame(frame.id)}>
        <i className="radio-dot" aria-hidden="true" /><span><strong title={frame.id}>{frame.id}</strong>
          <small><b className={`source-${frame.source}`}>{frame.source}</b> · {(frame.bytes / 1048576).toFixed(1)} MB</small></span>
        <em className={frame.has_artifacts ? "has-result" : "no-result"}>{frame.has_artifacts ? "有结果" : "待识别"}</em>
      </button>)}
    </div>
    {!state.frames.length && <div className="empty"><Database size={24} /><p>暂无点云帧</p>
      <button className="secondary" disabled={locked} onClick={() => input.current?.click()}>上传第一帧</button></div>}
    {state.frame && <button className="secondary wide next-recognition" onClick={() => onNavigate(2)}>前往 AI 识别<ArrowRight size={16} /></button>}
    {confirmClear && <Modal title="清空工作区帧列表" onClose={() => setConfirmClear(false)}>
      <p>移除本次会话中的帧列表并卸载点云，不删除后端文件。可通过刷新恢复。</p>
      <div className="modal-actions"><button className="secondary" onClick={() => setConfirmClear(false)}>保留列表</button>
        <button className="primary" disabled={locked} onClick={() => { setConfirmClear(false); void store.removeFramesFromWorkspace(state.frames.map((frame) => frame.id)); }}>确认清空</button></div>
    </Modal>}
  </Panel>;
}
