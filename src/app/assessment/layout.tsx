import type { ReactNode } from "react";
import { ParticipantShell } from "@/components/participant/ParticipantShell";
import { requireParticipant } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Every assessment screen sits in the participant frame, on the wider column the matching item needs. */
export default async function AssessmentLayout({ children }: { children: ReactNode }) {
  const user = await requireParticipant();
  return (
    <ParticipantShell code={user.username} wide>
      {children}
    </ParticipantShell>
  );
}
