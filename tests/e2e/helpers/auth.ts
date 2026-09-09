import { expect, type Page } from "@playwright/test";

/** A participant as the administrator's Allocation Register shows them. No personal data exists to carry. */
export interface ParticipantCredentials {
  code: string;
  password: string;
}

export const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "e2e-admin-password-2026";

/** Fills and submits the sign-in form. Does not wait for any particular destination. */
export async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Participant code").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** Signs in as the seeded administrator and waits for the admin overview. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await signIn(page, ADMIN_USERNAME, ADMIN_PASSWORD);
  await page.waitForURL(/\/admin\/?$/);
}

/** Signs in as a participant and waits for the dashboard. */
export async function loginAsParticipant(page: Page, code: string, password: string): Promise<void> {
  await signIn(page, code, password);
  await page.waitForURL(/\/dashboard\/?$/);
}

/**
 * Creates `count` participants through the administrator's bulk creation form and
 * reads the codes and passwords back out of the one-time Allocation Register on
 * screen. Requires an administrator session.
 */
export async function createParticipants(page: Page, count: number): Promise<ParticipantCredentials[]> {
  await page.goto("/admin/participants");
  await page.getByLabel("How many").fill(String(count));
  await page.getByRole("button", { name: "Create participants" }).click();

  const register = page.getByRole("table", { name: "Allocation Register" });
  await expect(register).toBeVisible();
  const rows = register.locator("tbody tr");
  await expect(rows).toHaveCount(count);

  const created: ParticipantCredentials[] = [];
  for (let i = 0; i < count; i += 1) {
    const cells = rows.nth(i).locator("td");
    created.push({
      code: (await cells.nth(0).innerText()).trim(),
      password: (await cells.nth(1).innerText()).trim(),
    });
  }
  return created;
}

/** Signs the current user out through the confirmation page and waits for the sign-in screen. */
export async function logout(page: Page): Promise<void> {
  await page.goto("/logout");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login\/?$/);
}
