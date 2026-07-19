const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  const map = {};
  let text = fs.readFileSync(file, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map[m[1]] = v.replace(/\\n/g, "\n");
  }
  return map;
}

async function main() {
  const env = loadEnv(path.join(process.cwd(), ".env.local"));
  const pk = env.FIREBASE_PRIVATE_KEY || "";
  console.log("private_key_loaded:", pk.length > 0);
  console.log("private_key_begin:", pk.startsWith("-----BEGIN PRIVATE KEY-----"));
  console.log("private_key_newlines:", (pk.match(/\n/g) || []).length);

  // 1) Admin init
  try {
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      });
    }
    console.log("firebase_admin_init: OK");
    console.log("firebase_project:", getApps()[0]?.options?.projectId);
  } catch (e) {
    console.log("firebase_admin_init: FAIL", String(e.message).split("\n")[0]);
    console.log(
      "fail_detail:",
      String(e.stack || e)
        .split("\n")
        .slice(0, 4)
        .join(" | "),
    );
  }

  // 2) Supabase schema probe
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.log("supabase_probe: NO_KEYS");
    return;
  }
  const { createClient } = require("@supabase/supabase-js");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const r1 = await sb.from("rr_drivers").select("id,fcm_token").limit(1);
  const r2 = await sb
    .from("rr_jobs")
    .select(
      "id,offered_driver_id,dispatch_attempts,dispatch_exhausted,customer_fcm_token",
    )
    .limit(1);
  console.log(
    "rr_drivers.fcm_token:",
    r1.error ? `MISSING_OR_ERROR: ${r1.error.message}` : "OK",
  );
  console.log(
    "rr_jobs.dispatch_cols:",
    r2.error ? `MISSING_OR_ERROR: ${r2.error.message}` : "OK",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
