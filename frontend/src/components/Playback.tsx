"use client";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { makeTimeline, sampleTimeline } from "../lib/trajectory";
import type { Program } from "../lib/types";
import type { TcpPose } from "./PointCloud";
export function usePlayback(program: Program | null, active = true) {
  const timeline = useMemo(
    () =>
      makeTimeline(program?.waypoints_cam_mm ?? [], program?.wpr_list ?? []),
    [program],
  );
  const [playing, setPlaying] = useState(false),
    [seconds, setSeconds] = useState(0),
    [speed, setSpeed] = useState(1),
    [previousProgram, setPreviousProgram] = useState(program);
  if (previousProgram !== program) {
    setPreviousProgram(program);
    setPlaying(false);
    setSeconds(0);
  }
  useEffect(() => {
    if (!playing || !active) return;
    let raf = 0,
      last = 0;
    const visibility = () => {
      last = 0;
    };
    document.addEventListener("visibilitychange", visibility);
    const tick = (time: number) => {
      if (!document.hidden && last) {
        const elapsed = ((time - last) / 1000) * speed;
        setSeconds((value) => Math.min(timeline.duration, value + elapsed));
      }
      last = time;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [playing, speed, timeline.duration, active]);
  const atEnd = seconds >= timeline.duration;
  const pose: TcpPose | null =
    program && timeline.points.length
      ? sampleTimeline(timeline, seconds)
      : null;
  return {
    timeline,
    playing: playing && !atEnd,
    seconds,
    speed,
    pose,
    toggle: () => {
      if (atEnd) setSeconds(0);
      setPlaying(!playing || atEnd);
    },
    reset: () => {
      setPlaying(false);
      setSeconds(0);
    },
    seek: (percentage: number) =>
      setSeconds(
        Math.min(1, Math.max(0, percentage / 100)) * timeline.duration,
      ),
    setSpeed,
  };
}
export function Playback({
  playback,
  enabled,
}: {
  playback: ReturnType<typeof usePlayback>;
  enabled: boolean;
}) {
  const p = playback;
  return (
    <div className="playback">
      <button
        aria-label="重播"
        title="重置预演"
        disabled={!enabled}
        onClick={p.reset}
      >
        <RotateCcw size={16} />
      </button>
      <button
        className="play-button"
        disabled={!enabled}
        aria-label={p.playing ? "暂停" : "播放"}
        onClick={p.toggle}
      >
        {p.playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <input
        aria-label="预演进度"
        type="range"
        min="0"
        max="100"
        step=".01"
        value={
          p.timeline.duration ? (p.seconds / p.timeline.duration) * 100 : 0
        }
        onChange={(e) => p.seek(Number(e.target.value))}
        disabled={!enabled}
      />
      <span className="mono">
        {(p.pose?.distance ?? 0).toFixed(1)} / {p.timeline.length.toFixed(1)} mm
      </span>
      <select
        aria-label="播放速度"
        value={p.speed}
        onChange={(e) => p.setSpeed(Number(e.target.value))}
        disabled={!enabled}
      >
        {[0.2, 0.5, 1, 1.5, 2, 3].map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
      {p.pose?.hold && <span className="fine-badge">FINE · 0.4s</span>}
    </div>
  );
}
