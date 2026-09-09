import type { Metadata } from "next";
import { AvecLogo } from "@/components/brand/AvecLogo";
import { Button } from "@/components/ui/Button";
import { TITLE_DEVICE } from "@/engine/structure";
import { logoutAction } from "./actions";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Sign out` };
export const dynamic = "force-dynamic";

/** Confirms sign out. The session is cleared by the server action, never by a plain GET. */
export default function LogoutPage() {
  return (
    <main className="brand-gradient flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-white/30 bg-white p-8 shadow-card">
        <AvecLogo className="h-8 w-auto text-brand-500" />
        <h1 className="mt-6 text-xl">Sign out</h1>
        <p className="mt-2 text-sm text-ink-600">Any assessment in progress keeps its saved answers.</p>
        <form action={logoutAction} className="mt-6">
          <Button type="submit" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
