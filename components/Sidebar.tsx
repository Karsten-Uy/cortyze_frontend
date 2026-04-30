"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type CampaignSummary,
  type ReportSummary,
  createCampaign,
  listCampaigns,
  listReports,
} from "@/lib/api";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const UNCAT_KEY = "__uncategorized__";

/**
 * Persistent left rail. Three sections:
 *
 *   1. Top — brand mark + new-run button + nav links
 *      (New, Compare, Campaigns)
 *   2. Middle — campaigns (collapsible) with their runs nested under;
 *      uncategorized runs at the bottom
 *   3. Footer — current user + sign-out
 *
 * Reads /campaigns + /reports on mount. The list of runs is bounded to
 * the most recent 200 — we paginate later if anyone hits that.
 */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCampaigns, setOpenCampaigns] = useState<Record<string, boolean>>(
    {},
  );
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Initial fetch
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, r] = await Promise.all([
        listCampaigns(),
        listReports({ limit: 200 }),
      ]);
      setCampaigns(c);
      setReports(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // User email for footer
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (mounted) setUserEmail(data.user?.email ?? null);
      } catch {
        // ignore — footer just won't show email
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const reportsByCampaign = useMemo(() => {
    const out: Record<string, ReportSummary[]> = { [UNCAT_KEY]: [] };
    for (const c of campaigns) out[c.id] = [];
    for (const r of reports) {
      const k = r.campaign_id ?? UNCAT_KEY;
      if (!out[k]) out[k] = [];
      out[k].push(r);
    }
    return out;
  }, [campaigns, reports]);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const c = await createCampaign({ name: newName.trim() });
      setNewName("");
      setCreating(false);
      // Refresh and auto-open the new campaign
      await refresh();
      setOpenCampaigns((cur) => ({ ...cur, [c.id]: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSignOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — even on failure, the proxy will bounce them on next nav
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-border bg-surface">
      {/* Top brand + new run */}
      <div className="border-b border-border px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            C
          </span>
          <span className="text-sm font-semibold tracking-tight">Cortyze</span>
        </Link>
        <Link
          href="/"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          New run
        </Link>
      </div>

      {/* Nav */}
      <nav className="border-b border-border px-2 py-2">
        <NavItem href="/" pathname={pathname} label="Analyze" icon="run" />
        <NavItem
          href="/compare"
          pathname={pathname}
          label="Compare runs"
          icon="compare"
        />
        <NavItem
          href="/campaigns"
          pathname={pathname}
          label="Campaigns"
          icon="folder"
        />
      </nav>

      {/* History */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
            History
          </span>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="text-xs text-accent hover:text-accent-hover"
            title="New campaign"
          >
            + Campaign
          </button>
        </div>

        {creating && (
          <form
            onSubmit={handleCreateCampaign}
            className="mx-3 mb-2 rounded-lg border border-border bg-surface-muted p-2"
          >
            <input
              type="text"
              autoFocus
              placeholder="Campaign name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="block w-full rounded-md border border-border bg-surface px-2 py-1 text-xs focus:border-accent focus:outline-none"
            />
            <div className="mt-1.5 flex gap-1.5">
              <button
                type="submit"
                className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground hover:bg-accent-hover"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
                className="rounded-md px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && (
          <p className="px-4 py-2 text-xs text-foreground-subtle">Loading…</p>
        )}
        {error && (
          <p className="px-4 py-2 text-xs text-poor">{error}</p>
        )}

        {!loading &&
          !error &&
          (reports.length === 0 && campaigns.length === 0 ? (
            <p className="px-4 py-6 text-xs text-foreground-subtle">
              No runs yet. Click <span className="font-medium text-foreground">New run</span>{" "}
              above to score your first piece of content.
            </p>
          ) : (
            <>
              {campaigns.map((c) => (
                <CampaignFolder
                  key={c.id}
                  campaign={c}
                  runs={reportsByCampaign[c.id] ?? []}
                  open={openCampaigns[c.id] ?? false}
                  onToggle={() =>
                    setOpenCampaigns((cur) => ({
                      ...cur,
                      [c.id]: !cur[c.id],
                    }))
                  }
                  pathname={pathname}
                />
              ))}
              {reportsByCampaign[UNCAT_KEY] &&
                reportsByCampaign[UNCAT_KEY].length > 0 && (
                  <CampaignFolder
                    campaign={{
                      id: UNCAT_KEY,
                      name: "Uncategorized",
                      description: null,
                      run_count: reportsByCampaign[UNCAT_KEY].length,
                      last_run_at: null,
                    }}
                    runs={reportsByCampaign[UNCAT_KEY]}
                    open={openCampaigns[UNCAT_KEY] ?? true}
                    onToggle={() =>
                      setOpenCampaigns((cur) => ({
                        ...cur,
                        [UNCAT_KEY]: !cur[UNCAT_KEY],
                      }))
                    }
                    pathname={pathname}
                  />
                )}
            </>
          ))}
      </div>

      {/* Footer — user + sign out */}
      <div className="border-t border-border px-4 py-3">
        <div className="text-xs text-foreground-subtle">Signed in as</div>
        <div className="truncate text-sm text-foreground">
          {userEmail ?? "—"}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 text-xs text-foreground-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  pathname,
  label,
  icon,
}: {
  href: string;
  pathname: string;
  label: string;
  icon: "run" | "compare" | "folder";
}) {
  const active =
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
        active
          ? "bg-accent-soft text-accent"
          : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      <NavIcon kind={icon} />
      {label}
    </Link>
  );
}

function NavIcon({ kind }: { kind: "run" | "compare" | "folder" }) {
  const stroke = "currentColor";
  if (kind === "run") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <path d="M3 13l5-9 5 9z" stroke={stroke} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "compare") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <rect x="2" y="3" width="5" height="10" rx="1" stroke={stroke} strokeWidth={1.5} fill="none" />
        <rect x="9" y="3" width="5" height="10" rx="1" stroke={stroke} strokeWidth={1.5} fill="none" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M2 5a1 1 0 011-1h3l1 1h6a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"
        stroke={stroke}
        strokeWidth={1.5}
        fill="none"
      />
    </svg>
  );
}

function CampaignFolder({
  campaign,
  runs,
  open,
  onToggle,
  pathname,
}: {
  campaign: CampaignSummary;
  runs: ReportSummary[];
  open: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  return (
    <div className="px-2 py-0.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </svg>
        <span className="flex-1 truncate text-sm">{campaign.name}</span>
        <span className="text-[10px] text-foreground-subtle">
          {runs.length || campaign.run_count}
        </span>
      </button>

      {open && (
        <ul className="mt-0.5 space-y-0.5 pl-7">
          {runs.length === 0 && (
            <li className="px-2 py-1 text-xs text-foreground-subtle">
              No runs in this campaign yet.
            </li>
          )}
          {runs.map((r) => (
            <li key={r.request_id}>
              <Link
                href={`/run/${r.request_id}`}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-surface-muted ${
                  pathname === `/run/${r.request_id}`
                    ? "bg-accent-soft text-accent"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <span className="truncate">
                  {r.title ?? `${r.goal} · ${r.content_type}`}
                </span>
                <span className="ml-auto text-[10px] tabular-nums text-foreground-subtle">
                  {Math.round(r.overall_score)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
