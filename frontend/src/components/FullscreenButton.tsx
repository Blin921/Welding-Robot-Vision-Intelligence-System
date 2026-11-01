"use client";
import { useEffect, useState } from "react";
import { Expand, Shrink } from "lucide-react";
import { useWorkspace } from "../stores/provider";

export default function FullscreenButton() {
  const { store } = useWorkspace();
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === document.documentElement);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      store.notify("浏览器未允许全屏，请按 F11 切换全屏", "warn");
    }
  }
  const label = fullscreen ? "退出整页全屏" : "整页全屏";
  return <button className="app-fullscreen" aria-label={label} title={label} aria-pressed={fullscreen} onClick={() => void toggle()}>
    {fullscreen ? <Shrink size={17} /> : <Expand size={17} />}
  </button>;
}
