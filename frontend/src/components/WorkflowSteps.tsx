"use client";
import { useWorkspace } from "../stores/provider";
export default function WorkflowSteps({
  current,
  onNavigate,
}: {
  current: number;
  onNavigate: (tab: number) => void;
}) {
  const { state, store } = useWorkspace();
  const program = store.currentProgram(),
    push = store.currentPush();
  const steps = [
    {
      tab: 2,
      label: "帧与识别",
      ready: state.seams.length > 0,
      running:
        state.activeTask?.kind === "scan" ||
        state.activeTask?.kind === "recognize",
    },
    {
      tab: 3,
      label: "标定",
      ready: Boolean(state.calibration?.has_calib),
      running: state.pending === "calib",
    },
    { tab: 4, label: "焊缝", ready: state.selected !== null, running: false },
    {
      tab: 5,
      label: "程序与预演",
      ready: Boolean(program),
      running: state.pending === "program",
    },
    {
      tab: 6,
      label: "下发",
      ready: Boolean(push),
      running: state.pending === "push",
    },
  ];
  return (
    <nav className="workflow-steps" aria-label="五步业务流程">
      {steps.map((step, i) => (
        <button
          key={step.tab}
          className={
            current === step.tab || (current === 1 && i === 0) ? "current" : ""
          }
          aria-current={
            current === step.tab || (current === 1 && i === 0)
              ? "step"
              : undefined
          }
          title={`${step.label}：${step.running ? "进行中" : step.ready ? "就绪" : "未就绪"}`}
          onClick={() => onNavigate(step.tab)}
        >
          <i
            className={
              step.running ? "blue" : step.ready ? "green" : "idle-dot"
            }
          />
          <span>
            {i + 1}. {step.label}
          </span>
          {step.tab >= 5 && state.calibration?.uncalibrated && (
            <b aria-label="未标定警示">!</b>
          )}
        </button>
      ))}
    </nav>
  );
}
