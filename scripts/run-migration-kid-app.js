// scripts/run-migration-kid-app.js
// Runs 20260908000001 migration against live Supabase via API
const https = require("https");
const fs = require("fs");
const path = require("path");

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
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
  const migrationPath = path.join(__dirname, "../supabase/migrations/20260908000001_create_kid_monitoring_tables.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  console.log("Applying Kid Monitoring migration to project:", projectRef);
  const res = await apiRequest("api.supabase.com", `/v1/projects/${projectRef}/database/query`, "POST", {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": "SnapApp-Migration"
  }, { query: sql });

  console.log("Migration result status:", res.status);
  if (res.status >= 400) {
    console.error("Migration error body:", res.body);
  } else {
    console.log("Migration executed successfully!");
  }

  // Verification checks via REST API
  const checkDevices = await apiRequest(`${projectRef}.supabase.co`, "/rest/v1/monitored_devices?select=id,child_name&limit=1", "GET", {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`
  });
  console.log("Verification check (monitored_devices):", checkDevices.status === 200 ? "SUCCESS: monitored_devices verified!" : checkDevices.body);

  const checkCommands = await apiRequest(`${projectRef}.supabase.co`, "/rest/v1/device_commands?select=id,command&limit=1", "GET", {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`
  });
  console.log("Verification check (device_commands):", checkCommands.status === 200 ? "SUCCESS: device_commands verified!" : checkCommands.body);
}

main().catch(console.error);
