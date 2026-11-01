"use client";
import type { ReactNode } from "react";
import { Activity, FileCode2, Play, ShieldCheck } from "lucide-react";
import { useWorkspace } from "../../stores/provider";
import { Busy, Panel } from "../ui";

export default function AcquisitionStatus({ onScan, logs }: { onScan: () => void; logs: ReactNode }) {
  const { state } = useWorkspace();
  const frame = state.frames.find((item) => item.id === state.frame);
  const task = state.activeTask;
  const details = [
    ["当前帧", frame?.id ?? "未选择"],
    ["文件格式", "PCD"],
    ["点云数量", state.cloud?.header.n_full.toLocaleString() ?? "—"],
    ["数据来源", frame?.source ?? "—"],
    ["坐标系", "相机系"],
    ["标定状态", state.calibration?.has_calib ? "已标定" : "未标定"],
  ];
  return <>
    <Panel title="当前帧信息" icon={<FileCode2 />}>
      <div className="frame-info-grid">{details.map(([label, value]) =>
        <div key={label}><small>{label}</small><strong title={value}>{value}</strong></div>)}</div>
    </Panel>
    <Panel title="采集任务" icon={<Activity />}>
      <div className="scan-task-progress" role="status"><span className={task ? "running" : ""} />
        <small>{task ? task.kind === "scan" ? "正在采集" : "任务运行中" : "空闲"}</small></div>
      <p className="ready-line"><ShieldCheck size={17} />采集与识别任务互斥</p>
      <button className="primary wide" disabled={Boolean(task || state.pending)} onClick={onScan}>
        <Play size={15} /><Busy busy={task?.kind === "scan"}>开始采集</Busy></button>
    </Panel>
    {logs}
  </>;
}
