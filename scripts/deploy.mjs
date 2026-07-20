#!/usr/bin/env node
/**
 * Deploy Village Ride: logic tests → Playwright mock E2E → push (Vercel) → prod smoke.
 *
 * Usage: node scripts/deploy.mjs
 * Optional: DEPLOY_WEBHOOK=https://... for success/failure notify
 */
import { spawnSync } from "node:child_process";

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error(`Command failed (${r.status}): ${cmd} ${args.join(" ")}`);
  }
}

async function notify(ok, detail) {
  const url = process.env.DEPLOY_WEBHOOK?.trim();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok,
        detail,
        source: "village-ride-deploy",
        at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.warn("Webhook notify failed", e);
  }
}

async function main() {
  try {
    run("npm", ["run", "test:logic"]);
    run("npx", ["playwright", "test", "--project=chromium"]);
    run("git", ["push", "origin", "HEAD"]);
    console.log("\nWaiting ~70s for Vercel…");
    await new Promise((r) => setTimeout(r, 70_000));
    run("npm", ["run", "test:e2e:prod"]);
    await notify(true, "Deploy + smoke OK");
    console.log("\n✓ Deploy pipeline finished");
  } catch (e) {
    await notify(false, e instanceof Error ? e.message : String(e));
    console.error("\n✗ Deploy pipeline failed", e);
    process.exit(1);
  }
}

void main();
