import type { ReactNode } from "react";
import { ParticipantShell } from "@/components/participant/ParticipantShell";
import { requireParticipant } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The plan sits in the participant frame; the header and footer are hidden when it prints. */
export default async function PlanLayout({ children }: { children: ReactNode }) {
  const user = await requireParticipant();
  return <ParticipantShell code={user.username}>{children}</ParticipantShell>;
}
