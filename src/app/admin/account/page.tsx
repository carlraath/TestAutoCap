import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { TITLE_DEVICE } from "@/engine/structure";
import { AccountForm } from "./AccountForm";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Account` };

/** Rotate the administrator password. Every change is recorded in the audit log. */
export default function AccountPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl">Account</h1>
        <p className="mt-2 text-sm text-ink-600">Change the administrator password. Rotate it from the bootstrap value before go-live.</p>
      </div>
      <Card className="p-6">
        <AccountForm />
      </Card>
    </section>
  );
}
