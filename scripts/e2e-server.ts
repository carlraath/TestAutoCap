/**
 * Starts a production server on a throwaway database for Playwright.
 *
 *   npm run build && npm run e2e:server
 *
 * Fresh PGlite directory each run, admin seeded from fixed credentials, the
 * bank loaded from E2E_BANK (default bank/dev-sample.json), then "next start"
 * on 127.0.0.1:3100. Playwright waits for /api/health.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const port = process.env.E2E_PORT ?? "3100";
const dataDir = path.resolve(process.env.E2E_DATA_DIR ?? "./data/e2e");
const bank = process.env.E2E_BANK ?? (fs.existsSync("bank/bank.v1.json") ? "bank/bank.v1.json" : "bank/dev-sample.json");

const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: "",
  DATA_DIR: dataDir,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "e2e-only-session-secret-0123456789abcdef",
  ADMIN_USERNAME: process.env.E2E_ADMIN_USERNAME ?? "admin",
  ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD ?? "e2e-admin-password-2026",
  APP_URL: `http://127.0.0.1:${port}`,
  PORT: port,
};

fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

function run(label: string, args: string[]): void {
  const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", args, { stdio: "inherit", env, shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`${label} failed with exit code ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

run("migrate", ["tsx", "scripts/migrate.ts"]);
run("seed", ["tsx", "scripts/seed.ts"]);
run("load-bank", ["tsx", "scripts/load-bank.ts", bank, "--freeze"]);
// The administrator's reports need a cohort to report on. Seeding it here, before the server
// starts, keeps every run on a database built the same way from nothing.
if (process.env.E2E_SAMPLE_DATA === "1") {
  run("sample-data", ["tsx", "scripts/seed-sample-data.ts", "--participants=15", "--seed=7", "--force"]);
}

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", port, "-H", "127.0.0.1"], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    child.kill(sig);
  });
}
