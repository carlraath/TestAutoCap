"use server";

import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth";

/** Clears the session cookie and returns to the sign-in page. */
export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
