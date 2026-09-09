import type { ReactNode } from "react";
import Link from "next/link";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { logoutAction } from "@/app/logout/actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/statistics", label: "Statistics" },
  { href: "/admin/demand", label: "Demand" },
  { href: "/admin/items", label: "Items" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/export", label: "Export" },
  { href: "/admin/account", label: "Account" },
];

/** Admin shell: brand header, the admin navigation with Sign out, footer. Requires the admin role. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <AppHeader subtitle="Administration" right={<span className="text-ink-600">Signed in as {admin.username}</span>} />
      <nav aria-label="Administration" className="print-hidden border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-2 sm:px-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-card px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-tint-100 hover:text-brand-600"
            >
              {item.label}
            </Link>
          ))}
          <form action={logoutAction} className="ml-auto">
            <button type="submit" className="whitespace-nowrap rounded-card px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-tint-100 hover:text-brand-600">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <AppFooter />
    </>
  );
}
