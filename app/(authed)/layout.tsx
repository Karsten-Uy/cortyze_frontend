// Auth gating happens in proxy.ts (Next 16 middleware) — anything that
// reaches this layout already has a valid Supabase session. The shell
// chrome (top nav + sidebar) lives in the page component because its
// tabs share view-switcher state with the main pane.

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
