import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AvecLogo } from "@/components/brand/AvecLogo";
import { TITLE_DEVICE } from "@/engine/structure";
import { getSessionUser, homeFor } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Sign in` };
export const dynamic = "force-dynamic";

/** Centred sign-in card on the brand gradient. Signed-in visitors are sent home. */
export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(homeFor(user.role));
  return (
    <main className="brand-gradient flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-white/30 bg-white p-8 shadow-card">
        <AvecLogo className="h-8 w-auto text-brand-500" />
        <h1 className="mt-6 text-xl">Capability Placement</h1>
        <p className="mt-1 text-sm text-ink-600">Sign in with your participant code.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
