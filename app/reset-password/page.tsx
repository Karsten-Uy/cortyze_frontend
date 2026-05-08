"use client";

import Link from "next/link";
import { useState } from "react";

import {
  AuthShell,
  FieldLabel,
  FormError,
  FormNotice,
  authButton,
  authInput,
} from "@/components/auth/AuthShell";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

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
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" style={{ color: "var(--coral)", fontWeight: 500 }}>
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <FormNotice tone="green">
          Check your inbox at <strong>{email}</strong>. The link will sign you in
          and let you set a new password.
        </FormNotice>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={authInput}
            />
          </div>

          {error && <FormError>{error}</FormError>}

          <button
            type="submit"
            disabled={busy}
            style={{
              ...authButton,
              opacity: busy ? 0.6 : 1,
              cursor: busy ? "wait" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!busy) e.currentTarget.style.background = "var(--coral-2)";
            }}
            onMouseLeave={(e) => {
              if (!busy) e.currentTarget.style.background = "var(--coral)";
            }}
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
