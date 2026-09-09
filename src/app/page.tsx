import { redirect } from "next/navigation";
import { getSessionUser, homeFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Root route: anonymous visitors go to /login, participants to /dashboard, admins to /admin. */
export default async function Home(): Promise<never> {
  const user = await getSessionUser();
  redirect(user ? homeFor(user.role) : "/login");
}
