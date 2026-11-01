"use client";
import dynamic from "next/dynamic";
import {
  Activity,
  ArrowRight,
  Box,
  Crosshair,
  Database,
  FileCode2,
  Play,
  ScanLine,
  Send,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";
import { parseView } from "../lib/blob";
import { demoCloud, demoSeams } from "../lib/demo-data";
import FeatureArt from "./FeatureArt";
const Cloud = dynamic(() => import("./PointCloud"), { ssr: false });
export default function Overview({
  light,
  onNavigate,
  onHelp,
}: {
  light: boolean;
  onNavigate: (tab: number) => void;
  onHelp: () => void;
}) {
  const cloud = useMemo(() => parseView(demoCloud()), []),
    seams = useMemo(() => demoSeams(), []);
  return (
    <main className="overview">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> ROBOTIC WELDING INTELLIGENCE
          </div>
          <h2>
            看见每一道焊缝，
            <br />
            规划每一步轨迹<span>。</span>
          </h2>
          <p>
            从三维感知到轨迹预演
            <br />
            让复杂的焊接作业，成为清晰可控的工作流。
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => onNavigate(2)}>
              <Play size={16} fill="currentColor" />
              进入识别工作台
              <ArrowRight size={16} />
            </button>
            <button className="secondary" onClick={() => onNavigate(5)}>
              <Box size={17} />
              探索轨迹预演
            </button>
          </div>
          <div className="hero-foot">
            <span>
              <ShieldCheck size={15} />
              仅生成与传输文件
            </span>
            <b>·</b>
            <span>不触发机器人运动</span>
          </div>
        </div>
        <div className="hero-cloud" aria-label="首页静态三维展示">
          <Cloud
            cloud={cloud}
            seams={seams}
            selected={1}
            light={light}
            mode="语义"
            size={1.6}
            reset={0}
            grid
            interactive={false}
          />
          <div className="hero-scan-label">
            <span className="live-dot" /> WELDING / 3D PERCEPTION
          </div>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <h2>让工作流，一目了然</h2>
          <p>五个步骤，连接感知与执行</p>
        </div>
        <span className="mono">WORKFLOW / 01 — 05</span>
      </div>
      <div className="workflow-cards">
        {[
          {
            title: "数据采集与管理",
            en: "DATA ACQUISITION",
            desc: "激光感知，构建场景数字起点",
            icon: Database,
            tab: 1,
          },
          {
            title: "AI 焊缝识别",
            en: "AI RECOGNITION",
            desc: "语义分割，精准提取焊缝几何",
            icon: ScanLine,
            tab: 2,
          },
          {
            title: "坐标标定",
            en: "COORDINATE CALIBRATION",
            desc: "连接相机空间与机器人坐标",
            icon: Crosshair,
            tab: 3,
          },
          {
            title: "程序与轨迹预演",
            en: "PROGRAM & SIMULATION",
            desc: "可视化轨迹，预览每一步运动",
            icon: Workflow,
            tab: 5,
          },
          {
            title: "机器人程序下发",
            en: "ROBOT DEPLOYMENT",
            desc: "安全传输，连接控制器工作流",
            icon: Send,
            tab: 6,
          },
        ].map((card, i) => (
          <button
            key={card.title}
            className="workflow-card"
            onClick={() => onNavigate(card.tab)}
          >
            <div className="card-top">
              <span className="feature-icon">
                <card.icon />
              </span>
              <span className="card-number">0{i + 1}</span>
            </div>
            <FeatureArt index={i} />
            <small>{card.en}</small>
            <h3>
              {card.title}
              <ArrowRight size={17} />
            </h3>
            <p>{card.desc}</p>
          </button>
        ))}
      </div>
      <div className="overview-bottom">
        <div>
          <span className="status-orb">
            <Activity size={18} />
          </span>
          <div>
            <strong>让每一步决策，都有迹可循</strong>
            <p>采集、识别、标定、预演与下发，整合于同一工作空间。</p>
          </div>
          <span className="badge">VISION TO ACTION</span>
        </div>
        <button onClick={onHelp}>
          了解系统工作方式 <ArrowRight size={16} />
        </button>
      </div>
      <span className="sr-only">
        <FileCode2 />
        首页点云为系统功能展示示意
      </span>
    </main>
  );
}
