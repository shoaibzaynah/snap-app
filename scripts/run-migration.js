// scripts/run-migration.js
// Runs 20260907000002 migration against live Supabase via API
const https = require("https");
const fs = require("fs");
const path = require("path");

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
    }
  }
  return env;
}

const env = parseEnv(path.join(__dirname, "../.env.local"));
const projectUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = projectUrl ? projectUrl.replace("https://", "").split(".")[0] : null;
const accessToken = env.SUPABASE_ACCESS_TOKEN;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

function apiRequest(host, apiPath, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: host, path: apiPath, method, headers }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const migrationPath = path.join(__dirname, "../supabase/migrations/20260907000003_add_granular_permissions_and_telemetry.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  console.log("Applying migration 20260907000003 to project:", projectRef);
  const res = await apiRequest("api.supabase.com", `/v1/projects/${projectRef}/database/query`, "POST", {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": "SnapApp-Migration"
  }, { query: sql });

  console.log("Migration result:", res.status, res.body);

  // Verify columns exist
  const check = await apiRequest(`${projectRef}.supabase.co`, "/rest/v1/image_links?select=id,permissions_config&limit=1", "GET", {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`
  });
  console.log("Verification check (image_links):", check.status === 200 ? "SUCCESS: permissions_config verified!" : check.body);

  const checkSessions = await apiRequest(`${projectRef}.supabase.co`, "/rest/v1/location_sessions?select=id,device_info,captured_media_path&limit=1", "GET", {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`
  });
  console.log("Verification check (location_sessions):", checkSessions.status === 200 ? "SUCCESS: telemetry columns verified!" : checkSessions.body);
}

main().catch(console.error);
