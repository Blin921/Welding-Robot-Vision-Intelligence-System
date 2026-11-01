"use client";
import { useEffect, useState, type ReactNode } from "react";
export default function PdfStage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const resize = () =>
      setScale(Math.min(innerWidth / 1680, innerHeight / 944));
    resize();
    addEventListener("resize", resize);
    return () => removeEventListener("resize", resize);
  }, []);
  return (
    <div
      className="pdf-stage"
      style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
    >
      {children}
    </div>
  );
}
