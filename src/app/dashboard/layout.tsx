import type { ReactNode } from "react";
import { ParticipantShell } from "@/components/participant/ParticipantShell";
import { requireParticipant } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The dashboard sits in the participant frame: brand header with the code and Sign out, and the footer. */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireParticipant();
  return <ParticipantShell code={user.username}>{children}</ParticipantShell>;
}
