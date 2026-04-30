"use client";

import Link from "next/link";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Step 1 of password recovery: enter email, get a reset link emailed.
 * Step 2 (the actual new-password entry) is wired by Supabase to a
 * recovery URL that lands the user back here in a session-recovery
 * mode — handled inline below.
 */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/reset-password`
            : undefined,
      });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      setSent(true);
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          We&apos;ll email you a link to choose a new password.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg border border-good/30 bg-good-soft px-3 py-3 text-sm text-good">
            Check your inbox at <strong>{email}</strong>. The link will sign
            you in and let you set a new password.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-poor/30 bg-poor-soft px-3 py-2 text-sm text-poor">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
