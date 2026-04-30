"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  type Campaign,
  type CampaignSummary,
  createCampaign,
  deleteCampaign,
  listCampaigns,
  updateCampaign,
} from "@/lib/api";

/**
 * Campaigns list + CRUD page. Lists every campaign with run-count and
 * last-run timestamp so the user can decide which to retire / merge.
 * Inline-edit name / description, delete with confirm.
 *
 * Deleting a campaign nullifies `reports.campaign_id` (FK ON DELETE SET
 * NULL on the DB side) — the runs themselves survive but become
 * "Uncategorized" in the sidebar.
 */
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setCampaigns(await listCampaigns());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createCampaign({
        name: newName.trim(),
        description: newDesc.trim() || null,
      });
      setNewName("");
      setNewDesc("");
      setCreating(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign? Runs in it will become uncategorized.")) {
      return;
    }
    try {
      await deleteCampaign(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Group runs by ad-brief, product launch, or experiment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          + New campaign
        </button>
      </header>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="card space-y-3 p-4"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Campaign name (e.g. Holiday 2026)"
            autoFocus
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Brief description, target audience, brand voice notes — optional."
            rows={2}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName("");
                setNewDesc("");
              }}
              className="rounded-md px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-poor/30 bg-poor-soft px-3 py-2 text-sm text-poor">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-foreground-subtle">Loading…</p>
      ) : campaigns.length === 0 ? (
        <div className="card p-8 text-center text-sm text-foreground-muted">
          No campaigns yet. Click <strong>New campaign</strong> above to create
          one — you can also create one inline from the sidebar.
        </div>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((c) => (
            <CampaignRow
              key={c.id}
              campaign={c}
              editing={editingId === c.id}
              onEditStart={() => setEditingId(c.id)}
              onEditDone={async () => {
                setEditingId(null);
                await refresh();
              }}
              onDelete={() => handleDelete(c.id)}
              onError={(m) => setError(m)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  editing,
  onEditStart,
  onEditDone,
  onDelete,
  onError,
}: {
  campaign: CampaignSummary;
  editing: boolean;
  onEditStart: () => void;
  onEditDone: () => void;
  onDelete: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(campaign.name);
  const [desc, setDesc] = useState(campaign.description ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      const out: Partial<Campaign> = {};
      if (name !== campaign.name) out.name = name;
      if ((desc || null) !== campaign.description) out.description = desc || null;
      await updateCampaign(campaign.id, out);
      onEditDone();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="block w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={busy}
                  className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={onEditDone}
                  className="rounded-md px-3 py-1 text-xs text-foreground-muted hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-medium text-foreground">{campaign.name}</h3>
              {campaign.description && (
                <p className="mt-1 text-xs text-foreground-muted">
                  {campaign.description}
                </p>
              )}
              <p className="mt-2 text-xs text-foreground-subtle">
                {campaign.run_count} {campaign.run_count === 1 ? "run" : "runs"}
                {campaign.last_run_at && (
                  <>
                    {" · "}last run{" "}
                    {new Date(campaign.last_run_at).toLocaleDateString()}
                  </>
                )}
              </p>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex gap-2">
            <Link
              href={`/?campaign=${campaign.id}`}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted hover:border-border-strong hover:text-foreground"
            >
              New run
            </Link>
            <button
              type="button"
              onClick={onEditStart}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted hover:border-border-strong hover:text-foreground"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-poor/30 bg-poor-soft px-2.5 py-1 text-xs text-poor hover:bg-poor hover:text-poor-soft"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
