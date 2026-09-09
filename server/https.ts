/**
 * Self-hosted HTTPS entry point: one Node process serving the production build
 * over TLS. Used for local deployment and any host with a persistent volume
 * (Railway, Render, Fly, a VM). Not used on Vercel, which terminates TLS itself.
 *
 *   npm run build && npm run start:https
 */
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import https from "node:https";
import { parse } from "node:url";
import next from "next";

loadEnvConfig(process.cwd());

const port = Number(process.env.PORT ?? 3443);
const hostname = process.env.HOST ?? "0.0.0.0";
const keyPath = process.env.TLS_KEY_PATH ?? "./certs/dev-key.pem";
const certPath = process.env.TLS_CERT_PATH ?? "./certs/dev-cert.pem";

async function main(): Promise<void> {
  for (const p of [keyPath, certPath]) {
    if (!fs.existsSync(p)) {
      throw new Error(`TLS file not found: ${p}. Run "npm run cert:dev" for a self-signed certificate or set TLS_KEY_PATH and TLS_CERT_PATH.`);
    }
  }
  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, (req, res) => {
    void handle(req, res, parse(req.url ?? "/", true));
  });
  server.listen(port, hostname, () => {
    console.log(`Avec / Capability Placement listening on https://localhost:${port}`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
