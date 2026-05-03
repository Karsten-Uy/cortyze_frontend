"use client";

import { useEffect, useRef, useState } from "react";

import { Sidebar, type SidebarView } from "@/components/lab/Sidebar";
import { Header } from "@/components/lab/Header";
import { LabBench } from "@/components/lab/LabBench";
import { InsightView } from "@/components/lab/InsightView";
import { CompareView } from "@/components/lab/CompareView";
import type { BrainView } from "@/components/lab/BrainMap";
import { LAB_DATA, type LabCampaign } from "@/lib/lab/data";

type View = "bench" | "insight" | "compare";
type RunState = "idle" | "running" | "done";

function RunningBar({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 49 + 60,
        left: 0,
        right: 0,
        height: 2,
        background: "var(--rule-2)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "40%",
          background: "linear-gradient(90deg, transparent, var(--teal), transparent)",
          animation: "labSweep 1.4s linear infinite",
        }}
      />
    </div>
  );
}

export default function LabPage() {
  const data = LAB_DATA;

  const [view, setView] = useState<View>("insight");
  const [campaign, setCampaign] = useState<LabCampaign>(data.campaigns[0]);
  const [collapsed, setCollapsed] = useState(false);
  const [currentRunId, setCurrentRunId] = useState("r-014");
  const [runState, setRunState] = useState<RunState>("idle");
  const [brainView, setBrainView] = useState<BrainView>("axial");

  const currentRun = data.history.find((h) => h.id === currentRunId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const insightRef = useRef<HTMLDivElement>(null);

  const handleRun = () => {
    setRunState("running");
    setTimeout(() => {
      setRunState("done");
      setView("insight");
    }, 1600);
  };

  useEffect(() => {
    if (runState === "done" && view === "insight" && scrollRef.current && insightRef.current) {
      const id = setTimeout(() => {
        const top = insightRef.current!.offsetTop;
        scrollRef.current!.scrollTo({ top, behavior: "smooth" });
      }, 120);
      return () => clearTimeout(id);
    }
  }, [runState, view]);

  const handleSelectRun = (id: string) => {
    setCurrentRunId(id);
    setView("insight");
  };

  const handleNew = () => {
    setView("bench");
    setRunState("idle");
  };

  const sidebarView: SidebarView = view === "compare" ? "compare" : "bench";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--paper)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        history={data.history}
        currentRunId={currentRunId}
        onSelectRun={handleSelectRun}
        onNew={handleNew}
        view={sidebarView}
        setView={(v) => {
          if (v === "bench") {
            setView("bench");
          } else {
            setView(v);
          }
        }}
      />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          position: "relative",
        }}
      >
        <Header
          campaign={campaign}
          onCampaignChange={setCampaign}
          view={view}
          currentRun={currentRun}
          onCompare={() => setView("compare")}
        />

        {view === "compare" ? (
          <CompareView data={data} />
        ) : view === "bench" ? (
          <LabBench onRun={handleRun} runState={runState} campaign={campaign} />
        ) : (
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ borderBottom: "1px solid var(--rule)", flexShrink: 0 }}>
              <LabBench
                embedded
                onRun={handleRun}
                runState={runState}
                campaign={campaign}
              />
            </div>
            <RunningBar visible={runState === "running"} />
            <div ref={insightRef}>
              <InsightView data={data} brainView={brainView} setBrainView={setBrainView} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
