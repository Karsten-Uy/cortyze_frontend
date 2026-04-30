import { Sidebar } from "@/components/Sidebar";

/**
 * Shell for every authenticated route. Sidebar is fixed-width on the
 * left; main content scrolls independently. Authentication itself is
 * gated by `proxy.ts` — by the time this layout renders, we know the
 * user has a valid Supabase session.
 */
export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
