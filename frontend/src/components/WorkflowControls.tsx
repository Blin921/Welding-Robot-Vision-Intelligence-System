"use client";
import { type Dispatch, type SetStateAction } from "react";
import {
  Crosshair,
  Database,
  FileCode2,
  FileUp,
  Play,
  Send,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { useWorkspace } from "../stores/provider";
import type {
  FtpSettings,
  PointPair,
  ProgramSettings,
  RecognizeRequest,
  ScanRequest,
} from "../lib/types";
import { validateRecognition } from "../lib/validation";
import { Busy, Field, Notice, Panel } from "./ui";
import SeamList from "./SeamList";
import AcquisitionControls from "./AcquisitionControls";
export interface Forms {
  scan: ScanRequest;
  recognize: Omit<RecognizeRequest, "frame">;
  program: ProgramSettings;
  ftp: FtpSettings;
  pairs: PointPair[];
  matrix: string;
  calibMode: "pairs" | "matrix";
}
export const INITIAL_PAIRS: PointPair[] = [
  { cam: [245.671, 132.488, 78.356], base: [1023.445, 567.231, 321.772] },
  { cam: [518.23, 76.442, 203.115], base: [148.662, 802.371, 610.558] },
  { cam: [362.774, 241.663, 156.221], base: [1189.331, 745.208, 492.776] },
];
export default function WorkflowControls({
  tab,
  forms,
  setForms,
  onCalibrate,
  onClear,
  onGenerate,
  onPush,
  onSeamAction,
  onNavigate,
}: {
  tab: number;
  onNavigate: (tab: number) => void;
  forms: Forms;
  setForms: Dispatch<SetStateAction<Forms>>;
  onCalibrate: () => void;
  onClear: () => void;
  onGenerate: () => void;
  onPush: () => void;
  onSeamAction: (
    action: "view" | "preview" | "program" | "push",
    id: number,
  ) => void;
}) {
  const { store, state } = useWorkspace();
  const numeric = (
    section: "scan" | "recognize" | "program" | "ftp",
    key: string,
    value: string,
  ) =>
    setForms((f) => ({
      ...f,
      [section]: {
        ...f[section],
        [key]: value.trim() === "" ? NaN : Number(value),
      },
    }));
  const field = (
    section: "scan" | "recognize" | "program" | "ftp",
    key: string,
    label: string,
    unit?: string,
    min?: number,
    max?: number,
    step?: number,
  ) => {
    const value = (forms[section] as unknown as Record<string, number>)[key];
    return (
      <Field
        key={key}
        label={label}
        value={value}
        onChange={(v) => numeric(section, key, v)}
        type="number"
        unit={unit}
        min={min}
        max={max}
        step={step}
      />
    );
  };
  const locked = Boolean(state.activeTask),
    pending = Boolean(state.pending);
  const program = store.currentProgram();
  return (
    <>
      {tab === 1 && (
        <AcquisitionControls
          forms={forms}
          setForms={setForms}
          onNavigate={onNavigate}
        />
      )}
      {tab === 2 && (
        <>
          <Panel title="帧选择与识别控制" icon={<Database />}>
            <label className="recognition-frame-select">
              <Database size={17} />
              <select
                aria-label="当前帧"
                value={state.frame}
                onChange={(e) => void store.selectFrame(e.target.value)}
              >
                {!state.frame && <option value="">请选择帧</option>}
                {state.frames.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.id}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary wide"
              disabled={!state.frame || state.loading}
              onClick={() => void store.selectFrame(state.frame)}
            >
              <FileUp size={16} />
              载入点云
            </button>
            {!state.frames.length && (
              <Notice>
                暂无帧，请先
                <button className="text-button" onClick={() => onNavigate(1)}>
                  上传或采集点云
                </button>
                。
              </Notice>
            )}
            <div className="recognition-actions">
              <label className="switch-row">
                <span>
                  复用历史结果<small>后端直读历史产物，不加载模型</small>
                </span>
                <input
                  aria-label="复用历史结果"
                  type="checkbox"
                  checked={forms.recognize.reuse_artifacts}
                  disabled={locked || pending}
                  onChange={(e) =>
                    setForms((f) => ({
                      ...f,
                      recognize: {
                        ...f.recognize,
                        reuse_artifacts: e.target.checked,
                      },
                    }))
                  }
                />
              </label>
              <button
                className="primary wide"
                disabled={locked || pending || !state.frame}
                onClick={() => {
                  const error = validateRecognition(forms.recognize);
                  if (error) store.notify(error, "error");
                  else
                    void store.run("recognize", {
                      ...forms.recognize,
                      frame: state.frame,
                    });
                }}
              >
                <Play size={16} />
                <Busy busy={state.activeTask?.kind === "recognize"}>
                  {locked ? "任务运行中" : "开始识别"}
                </Busy>
              </button>
            </div>
          </Panel>
          <Panel title="高级识别参数" icon={<Settings2 />} defaultOpen={false}>
            {field("recognize", "voxel", "voxel 体素", "mm", 0.001)}
            {field("recognize", "tile", "tile 块大小", "mm", 0.001)}
            {field("recognize", "stride", "stride 步长", "mm", 0.001)}
            {field(
              "recognize",
              "smooth_k",
              "smooth_k 邻域",
              undefined,
              1,
              undefined,
              1,
            )}
            {field("recognize", "smooth_r", "smooth_r 半径", "mm", 0.001)}
            {field("recognize", "max_gap", "max_gap 间隙", "m", 0.000001)}
            {field("recognize", "min_len", "最短焊缝长度", "mm", 0)}
          </Panel>
        </>
      )}
      {tab === 3 && (
        <Panel title="坐标标定" icon={<Crosshair />}>
          <div className="segmented">
            <button
              className={forms.calibMode === "pairs" ? "active" : ""}
              onClick={() => setForms((f) => ({ ...f, calibMode: "pairs" }))}
            >
              点对表单
            </button>
            <button
              className={forms.calibMode === "matrix" ? "active" : ""}
              onClick={() => setForms((f) => ({ ...f, calibMode: "matrix" }))}
            >
              JSON / 矩阵
            </button>
          </div>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              onCalibrate();
            }}
          >
            {forms.calibMode === "matrix" ? (
              <label className="matrix-label">
                粘贴 JSON / JSON / 矩阵
                <textarea
                  aria-label="4x4 标定矩阵"
                  className="matrix-input"
                  value={forms.matrix}
                  onChange={(e) =>
                    setForms((f) => ({ ...f, matrix: e.target.value }))
                  }
                />
              </label>
            ) : (
              <>
                {forms.pairs.map((pair, i) => (
                  <div className="pair" key={i}>
                    <div>
                      <span className="pair-num">{i + 1}</span>点对 {i + 1}
                      <button
                        type="button"
                        onClick={() =>
                          setForms((f) => ({
                            ...f,
                            pairs: f.pairs.filter((_, j) => j !== i),
                          }))
                        }
                        aria-label={`删除点对 ${i + 1}`}
                      >
                        删除
                      </button>
                    </div>
                    <div className="pair-head">
                      <span>相机 XYZ (mm)</span>
                      <span>基座 XYZ (mm)</span>
                    </div>
                    {["X", "Y", "Z"].map((axis, j) => (
                      <div className="pair-values" key={axis}>
                        <span>{axis}</span>
                        {(["cam", "base"] as const).map((side) => (
                          <input
                            key={side}
                            type="number"
                            step="any"
                            required
                            aria-label={`点对${i + 1}${side === "cam" ? "相机" : "基座"}${axis}`}
                            value={
                              Number.isFinite(pair[side][j])
                                ? pair[side][j]
                                : ""
                            }
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value);
                              setForms((f) => ({
                                ...f,
                                pairs: f.pairs.map((p, index) =>
                                  index === i
                                    ? {
                                        ...p,
                                        [side]: p[side].map((v, k) =>
                                          k === j ? value : v,
                                        ),
                                      }
                                    : p,
                                ),
                              }));
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
            <div className="calibration-buttons">
              {forms.calibMode === "pairs" && (
                <>
                  {" "}
                  <button
                    type="button"
                    className="secondary wide"
                    onClick={() =>
                      setForms((f) => ({
                        ...f,
                        pairs: [
                          ...f.pairs,
                          { cam: [0, 0, 0], base: [0, 0, 0] },
                        ],
                      }))
                    }
                  >
                    ＋ 添加点对
                  </button>
                </>
              )}
              <button
                className="primary wide spaced"
                disabled={
                  pending ||
                  !state.frame ||
                  (forms.calibMode === "pairs" && forms.pairs.length < 3)
                }
              >
                <Busy busy={state.pending === "calib"}>保存标定</Busy>
              </button>
              <button
                type="button"
                className="text-button wide"
                disabled={pending || !state.calibration?.has_calib}
                onClick={onClear}
              >
                清除标定
              </button>
            </div>
          </form>
        </Panel>
      )}
      {tab === 4 && (
        <Panel
          title="焊缝列表"
          icon={<Crosshair />}
          extra={<span className="count">{state.seams.length}</span>}
        >
          <Field
            label="最短长度"
            type="number"
            value={forms.recognize.min_len}
            onChange={(v) => numeric("recognize", "min_len", v)}
            min={0}
            unit="mm"
          />
          <SeamList
            minLength={
              Number.isFinite(forms.recognize.min_len)
                ? forms.recognize.min_len
                : 0
            }
            onAction={onSeamAction}
          />
        </Panel>
      )}
      {tab === 5 && (
        <Panel title="程序与轨迹预演" icon={<FileCode2 />}>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              onGenerate();
            }}
          >
            <Field
              label="程序名称"
              value={forms.program.name}
              onChange={(v) =>
                setForms((f) => ({ ...f, program: { ...f.program, name: v } }))
              }
              placeholder="留空由帧名生成"
              maxLength={8}
            />
            <Field
              label="程序备注"
              value={forms.program.comment}
              onChange={(v) =>
                setForms((f) => ({
                  ...f,
                  program: { ...f.program, comment: v },
                }))
              }
              maxLength={60}
            />
            {field(
              "program",
              "utool",
              "工具号 UTOOL",
              undefined,
              0,
              undefined,
              1,
            )}
            {field(
              "program",
              "uframe",
              "坐标系 UFRAME",
              undefined,
              0,
              undefined,
              1,
            )}
            <Field
              label="姿态 W,P,R"
              value={forms.program.wpr}
              onChange={(v) =>
                setForms((f) => ({ ...f, program: { ...f.program, wpr: v } }))
              }
            />
            <label className="switch-row">
              包含焊接指令
              <input
                type="checkbox"
                checked={forms.program.weld}
                onChange={(e) =>
                  setForms((f) => ({
                    ...f,
                    program: { ...f.program, weld: e.target.checked },
                  }))
                }
              />
            </label>
            <details open className="program-advanced">
              <summary>高级参数</summary>
              <label className="field">
                <span>指令名称</span>
                <select
                  aria-label="指令名称"
                  value={forms.program.inst}
                  onChange={(e) =>
                    setForms((f) => ({
                      ...f,
                      program: {
                        ...f.program,
                        inst: e.target.value as "Weld" | "Arc",
                      },
                    }))
                  }
                >
                  <option>Weld</option>
                  <option>Arc</option>
                </select>
              </label>
              {field(
                "program",
                "weld_prog",
                "焊机程序号",
                undefined,
                0,
                undefined,
                1,
              )}
              {field(
                "program",
                "weld_set",
                "焊机设定号",
                undefined,
                0,
                undefined,
                1,
              )}
              {field("program", "speed_weld", "焊接速度", "cm/min", 0.001)}
              {field("program", "eps", "简化偏差 eps", "mm", 0.001)}
              {field("program", "max_seg", "途经点最大间距", "mm", 0.001)}
            </details>
            {state.calibration?.uncalibrated && (
              <div className="notice warning uncalibrated-warning">
                <TriangleAlert />
                坐标仍是相机系，禁止上机。
              </div>
            )}
            <button
              className="primary wide"
              disabled={
                pending ||
                state.loading ||
                state.selected === null ||
                !state.calibration
              }
            >
              <Busy busy={state.pending === "program"}>生成 .LS 程序</Busy>
            </button>
          </form>
        </Panel>
      )}
      {tab === 6 && (
        <Panel title="FTP 文件传输" icon={<Send />}>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              onPush();
            }}
          >
            <div className="form-section-label">控制器连接信息</div>
            <Field
              label="控制器地址"
              value={forms.ftp.host}
              onChange={(v) =>
                setForms((f) => ({ ...f, ftp: { ...f.ftp, host: v } }))
              }
              placeholder="请输入地址"
            />
            {field("ftp", "port", "端口", undefined, 1, 65535, 1)}
            {(["user", "password", "remote_dir"] as const).map((key, i) => (
              <Field
                key={key}
                label={["用户名", "密码", "目标目录"][i]}
                value={forms.ftp[key]}
                type={key === "password" ? "password" : "text"}
                onChange={(v) =>
                  setForms((f) => ({ ...f, ftp: { ...f.ftp, [key]: v } }))
                }
              />
            ))}
            <details className="ftp-advanced">
              <summary>高级连接选项</summary>
              {field("ftp", "timeout_s", "连接超时", "s", 1)}
            </details>
            <label className="switch-row">
              被动模式
              <input
                type="checkbox"
                checked={forms.ftp.passive}
                onChange={(e) =>
                  setForms((f) => ({
                    ...f,
                    ftp: { ...f.ftp, passive: e.target.checked },
                  }))
                }
              />
            </label>
            <Notice warning={Boolean(program?.uncalibrated)}>
              {program?.uncalibrated
                ? "坐标仍是相机系，禁止上机。先标定并重新生成。"
                : "仅传输程序文件，不触发机器人运动。"}
            </Notice>
            <button
              className="primary wide"
              disabled={pending || state.loading}
            >
              <Busy busy={state.pending === "push"}>预览下发确认</Busy>
              <Send size={15} />
            </button>
            {state.mode === "demo" && (
              <p className="hint">
                演示模式不连接真实设备；fail.demo 可测试失败路径。
              </p>
            )}
          </form>
        </Panel>
      )}
    </>
  );
}
