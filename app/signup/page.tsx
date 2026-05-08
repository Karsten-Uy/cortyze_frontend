"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import {
  AuthShell,
  FieldLabel,
  FormError,
  FormNotice,
  authButton,
  authInput,
} from "@/components/auth/AuthShell";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Create your account" subtitle="Start scoring ads in under a minute.">
          {" "}
        </AuthShell>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      if (data.session) {
        router.replace(next);
        router.refresh();
      } else {
        setInfo(
          "Check your email for a confirmation link. After confirming, sign in to continue.",
        );
        setBusy(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start scoring ads in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            style={{ color: "var(--coral)", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </>
      }
    >
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

        <div>
          <FieldLabel>Password</FieldLabel>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={authInput}
          />
          <p style={{ marginTop: 5, fontSize: 11, color: "var(--ink-3)" }}>
            At least 8 characters.
          </p>
        </div>

        <div>
          <FieldLabel>Confirm password</FieldLabel>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={authInput}
          />
        </div>

        {error && <FormError>{error}</FormError>}
        {info && <FormNotice tone="coral">{info}</FormNotice>}

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
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
