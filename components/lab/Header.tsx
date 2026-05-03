"use client";

import { useState } from "react";

import { I } from "./Icons";
import { LAB_DATA, type LabCampaign, type LabHistoryItem } from "@/lib/lab/data";

export type HeaderView = "bench" | "insight" | "compare";

export function Header({
  campaign,
  onCampaignChange,
  view,
  currentRun,
  onCompare,
}: {
  campaign: LabCampaign;
  onCampaignChange: (c: LabCampaign) => void;
  view: HeaderView;
  currentRun: LabHistoryItem | undefined;
  onCompare: () => void;
}) {
  return (
    <header
      style={{
        height: 49,
        borderBottom: "1px solid var(--rule)",
        display: "flex",
        alignItems: "stretch",
        background: "var(--paper)",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
        whiteSpace: "nowrap",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        className="lab-header-campaign"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 18px",
          borderRight: "1px solid var(--rule)",
          flexShrink: 0,
        }}
      >
        <div
          className="lab-mono lab-header-campaign-label"
          style={{ fontSize: 9, letterSpacing: "0.14em", color: "var(--ink-3)" }}
        >
          CAMPAIGN
        </div>
        <CampaignPicker campaign={campaign} onChange={onCampaignChange} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 18px",
          fontSize: 12,
          color: "var(--ink-2)",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span className="lab-header-bc-prefix" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
          {view === "compare" ? "A/B Audit" : "Lab Bench"}
        </span>
        <span style={{ color: "var(--ink-4)", flexShrink: 0 }}>/</span>
        <span
          style={{
            color: "var(--ink)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            flex: 1,
          }}
        >
          {view === "compare"
            ? "Reset Ritual v3 ↔ Skin Diary"
            : view === "insight"
              ? currentRun?.title || "New analysis"
              : "New analysis"}
        </span>
        {view === "insight" && currentRun && (
          <span
            className="lab-mono lab-header-runbadge"
            style={{
              fontSize: 10,
              color: "var(--ink-3)",
              border: "1px solid var(--rule)",
              padding: "2px 6px",
              flexShrink: 0,
            }}
          >
            RUN-{currentRun.id.split("-")[1]}
          </span>
        )}
      </div>

      <div
        className="lab-header-right"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 12px",
          borderLeft: "1px solid var(--rule)",
          flexShrink: 0,
        }}
      >
        <HBtn onClick={onCompare} active={view === "compare"}>
          <I.Compare size={12} /> A/B
        </HBtn>
        <HBtn>
          <I.Upload size={12} /> Export
        </HBtn>
        <div className="lab-header-model" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 1, height: 18, background: "var(--rule)", margin: "0 4px" }} />
          <div
            className="lab-mono"
            style={{
              fontSize: 9,
              color: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: "#3B7A4F",
                borderRadius: "50%",
                animation: "labPulseDot 2.4s infinite",
              }}
            />
            MODEL · TRIBE-V2
          </div>
        </div>
      </div>
    </header>
  );
}

function CampaignPicker({
  campaign,
  onChange,
}: {
  campaign: LabCampaign;
  onChange: (c: LabCampaign) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="lab-header-cp-btn"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "1px solid var(--rule)",
          padding: "5px 10px",
          fontSize: 12,
          color: "var(--ink)",
          whiteSpace: "nowrap",
          flexShrink: 0,
          maxWidth: 240,
          overflow: "hidden",
        }}
      >
        <span style={{ width: 6, height: 6, background: "var(--teal)", flexShrink: 0 }} />
        <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{campaign.name}</span>
        <span
          className="lab-mono lab-header-cp-client"
          style={{ fontSize: 10, color: "var(--ink-3)" }}
        >
          / {campaign.client}
        </span>
        <I.ChevronD size={10} style={{ marginLeft: 4, flexShrink: 0 }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: 280,
            background: "#FBFBF9",
            border: "1px solid var(--rule)",
            boxShadow: "0 8px 24px rgba(26,26,27,0.06)",
            zIndex: 100,
          }}
        >
          <div
            className="lab-mono"
            style={{
              fontSize: 9,
              color: "var(--ink-3)",
              padding: "8px 12px 4px",
              letterSpacing: "0.12em",
            }}
          >
            SWITCH CAMPAIGN
          </div>
          {LAB_DATA.campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                border: "none",
                background: c.id === campaign.id ? "#F2F1EC" : "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</div>
              <div className="lab-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>
                {c.client}
              </div>
            </button>
          ))}
          <div style={{ borderTop: "1px solid var(--rule)" }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                fontSize: 12,
                color: "var(--teal-2)",
              }}
            >
              <I.Plus size={11} /> New campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        fontSize: 11,
        background: active ? "#1A1A1B" : "transparent",
        color: active ? "#F9F9F7" : "var(--ink-2)",
        border: "1px solid " + (active ? "#1A1A1B" : "var(--rule)"),
        fontWeight: 500,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
