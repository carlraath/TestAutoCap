import { notFound } from "next/navigation";
import { Harness } from "./Harness";

export const dynamic = "force-dynamic";

const DEFAULT_TIMER_SECONDS = 600;

/** Development-only harness for the participant interaction components. Not reachable in production. `?timer=N` sets the countdown in seconds. */
export default async function DevComponentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const raw = Array.isArray(params.timer) ? params.timer[0] : params.timer;
  const parsed = Number.parseInt(raw ?? "", 10);
  const seconds = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 3600) : DEFAULT_TIMER_SECONDS;
  const now = new Date();
  const endAt = new Date(now.getTime() + seconds * 1000);
  return <Harness serverNow={now.toISOString()} endAt={endAt.toISOString()} />;
}
