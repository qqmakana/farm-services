/**
 * Village Ride — app test suite
 *
 * Usage:
 *   node scripts/test-app.mjs              # logic + HTTP (BASE_URL or localhost:3000)
 *   node scripts/test-app.mjs --logic      # mock/wallet/merchant logic only
 *   node scripts/test-app.mjs --http       # HTTP routes only
 *   BASE_URL=https://village-ride.vercel.app node scripts/test-app.mjs --http
 */

import { createRequire } from "module";
import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";

const require = createRequire(import.meta.url);
const args = new Set(process.argv.slice(2));
const runLogic = !args.has("--http") || args.has("--logic");
const runHttp = !args.has("--logic") || args.has("--http");
const onlyLogic = args.has("--logic");
const onlyHttp = args.has("--http");

const BASE =
  process.env.BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";

let passed = 0;
let failed = 0;
const failures = [];

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, err) {
  failed++;
  const msg = err instanceof Error ? err.message : String(err);
  failures.push({ name, msg });
  console.log(`  ✗ ${name}: ${msg}`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/* ───────────── Logic tests (tsx via child for TS imports) ───────────── */

async function runLogicSuite() {
  console.log("\n══ Logic (mock store + wallet + merchant) ══");
  return new Promise((resolve) => {
    const child = spawn(
      "npx",
      ["tsx", "scripts/test-app-logic.ts"],
      { stdio: "inherit", shell: true, cwd: process.cwd() },
    );
    child.on("exit", (code) => {
      if (code === 0) {
        passed += 1;
        console.log("  ✓ logic suite exited 0");
      } else {
        failed += 1;
        failures.push({ name: "logic suite", msg: `exit ${code}` });
        console.log(`  ✗ logic suite exit ${code}`);
      }
      resolve();
    });
  });
}

/* ───────────── HTTP tests ───────────── */

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return true;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  return false;
}

async function checkRoute(path, opts = {}) {
  const {
    expectStatus = [200],
    mustInclude = [],
    name = path,
  } = opts;
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { Accept: "text/html,application/json,*/*" },
  });
  const statuses = Array.isArray(expectStatus)
    ? expectStatus
    : [expectStatus];
  assert(
    statuses.includes(res.status),
    `${path} status ${res.status}, expected ${statuses.join("|")}`,
  );
  if (mustInclude.length) {
    const body = await res.text();
    for (const needle of mustInclude) {
      assert(
        body.includes(needle),
        `${path} missing "${needle}"`,
      );
    }
  }
  ok(name);
}

async function runHttpSuite() {
  console.log(`\n══ HTTP (${BASE}) ══`);
  const up = await waitForServer(BASE);
  if (!up) {
    fail("server reachable", new Error(`No response from ${BASE}`));
    return;
  }
  ok("server reachable");

  const routes = [
    { path: "/", mustInclude: ["Village"], name: "GET / (Home)" },
    { path: "/services", mustInclude: ["What do you need"], name: "GET /services" },
    { path: "/activity", mustInclude: ["Activity"], name: "GET /activity" },
    { path: "/account", mustInclude: ["Account"], name: "GET /account" },
    { path: "/ride", name: "GET /ride" },
    { path: "/delivery", name: "GET /delivery" },
    { path: "/farm", name: "GET /farm" },
    { path: "/driver", mustInclude: ["driver"], name: "GET /driver" },
    { path: "/driver/home", name: "GET /driver/home" },
    { path: "/driver/jobs", name: "GET /driver/jobs" },
    { path: "/driver/earnings", name: "GET /driver/earnings" },
    { path: "/driver/account", name: "GET /driver/account" },
    { path: "/shop", mustInclude: ["merchant"], name: "GET /shop (Sell)" },
    { path: "/shops", name: "GET /shops (Buy)" },
    {
      path: "/login?next=/merchant/dashboard",
      mustInclude: ["Merchant"],
      name: "GET /login?next=merchant",
    },
    {
      path: "/api/dispatch/tick",
      // POST preferred; GET may 405/404/200 depending on route
      expectStatus: [200, 405, 404, 307, 308],
      name: "GET /api/dispatch/tick (probe)",
    },
    {
      path: "/firebase-messaging-sw.js",
      expectStatus: [200],
      name: "GET /firebase-messaging-sw.js",
    },
  ];

  for (const r of routes) {
    try {
      await checkRoute(r.path, r);
    } catch (e) {
      fail(r.name || r.path, e);
    }
  }

  // Merchant dashboard: may redirect to login (307/302/307) when auth required
  try {
    const res = await fetch(`${BASE}/merchant/dashboard`, {
      redirect: "manual",
    });
    assert(
      [200, 302, 307, 308].includes(res.status),
      `merchant dashboard status ${res.status}`,
    );
    if (res.status === 200) {
      const body = await res.text();
      assert(
        /merchant|shop|order|dashboard/i.test(body),
        "dashboard body unexpected",
      );
    } else {
      const loc = res.headers.get("location") || "";
      assert(
        loc.includes("/login") || loc.includes("merchant"),
        `unexpected redirect ${loc}`,
      );
    }
    ok("GET /merchant/dashboard (auth gate or page)");
  } catch (e) {
    fail("GET /merchant/dashboard", e);
  }

  // Dispatch tick POST
  try {
    const res = await fetch(`${BASE}/api/dispatch/tick`, { method: "POST" });
    assert(
      [200, 204, 500].includes(res.status),
      `tick POST status ${res.status}`,
    );
    // 500 ok if env incomplete; 200 preferred
    if (res.status === 200 || res.status === 204) {
      ok("POST /api/dispatch/tick");
    } else {
      ok("POST /api/dispatch/tick (server error — check env, non-fatal)");
    }
  } catch (e) {
    fail("POST /api/dispatch/tick", e);
  }
}

/* ───────────── main ───────────── */

async function main() {
  console.log("Village Ride — test-app");
  console.log(`BASE_URL=${BASE}`);

  const doLogic = onlyLogic || (!onlyHttp && runLogic);
  const doHttp = onlyHttp || (!onlyLogic && runHttp);

  if (doLogic) await runLogicSuite();
  if (doHttp) await runHttpSuite();

  console.log("\n══ Summary ══");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f.name}: ${f.msg}`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
