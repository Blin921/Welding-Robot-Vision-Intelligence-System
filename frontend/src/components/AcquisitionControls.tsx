"use client";
import type { Dispatch, SetStateAction } from "react";
import type { Forms } from "./WorkflowControls";
import FrameManager from "./acquisition/FrameManager";
import ScanSettings from "./acquisition/ScanSettings";

export default function AcquisitionControls({ forms, setForms, onNavigate }: {
  forms: Forms;
  setForms: Dispatch<SetStateAction<Forms>>;
  onNavigate: (tab: number) => void;
}) {
  return <>
    <FrameManager onNavigate={onNavigate} />
    <ScanSettings value={forms.scan} onChange={(scan) => setForms((previous) => ({ ...previous, scan }))} />
  </>;
}
