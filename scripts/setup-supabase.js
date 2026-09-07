// scripts/setup-supabase.js
// 100% Programmatic Supabase Provisioning via API: Storage Bucket, Tables, RLS, Realtime
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

if (!projectRef || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

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

async function runSql(sql) {
  if (accessToken) {
    const res = await apiRequest("api.supabase.com", `/v1/projects/${projectRef}/database/query`, "POST", {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": "SnapApp-Setup"
    }, { query: sql });
    return res;
  }
  return { status: 400, body: "No accessToken" };
}

async function setupStorageBucket() {
  console.log("Checking storage bucket 'snap-images'...");
  const listRes = await apiRequest(`${projectRef}.supabase.co`, "/storage/v1/bucket", "GET", {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`
  });

  const buckets = Array.isArray(listRes.body) ? listRes.body : [];
  const exists = buckets.some(b => b.name === "snap-images" || b.id === "snap-images");

  if (!exists) {
    console.log("Creating public bucket 'snap-images'...");
    const createRes = await apiRequest(`${projectRef}.supabase.co`, "/storage/v1/bucket", "POST", {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    }, {
      id: "snap-images",
      name: "snap-images",
      public: true,
      file_size_limit: 10485760,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"]
    });
    console.log("Bucket creation result:", createRes.status === 200 || createRes.status === 201 ? "SUCCESS" : createRes.body);
  } else {
    console.log("Bucket 'snap-images' already exists.");
  }
}

async function main() {
  console.log("🚀 Starting 100% Automated Supabase Setup for Project:", projectRef);
  
  // 1. Setup Storage Bucket
  await setupStorageBucket();

  // 2. Apply Master Schema SQL
  console.log("Applying database schema from MASTER_SCHEMA.sql...");
  const schemaPath = path.join(__dirname, "../supabase/MASTER_SCHEMA.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const sqlRes = await runSql(schemaSql);

  if (sqlRes.status === 200 || sqlRes.status === 201) {
    console.log("✅ Database schema & Realtime publication applied successfully!");
  } else {
    console.warn("SQL Execution response:", sqlRes.status, sqlRes.body);
  }

  // 3. Verify tables
  console.log("Verifying tables via REST API...");
  const checkRes = await apiRequest(`${projectRef}.supabase.co`, "/rest/v1/image_links?select=id&limit=1", "GET", {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`
  });
  console.log("Table check ('image_links'):", checkRes.status === 200 ? "VERIFIED ONLINE" : checkRes.body);
  console.log("🎉 Automated Supabase Provisioning Complete!");
}

main().catch(err => {
  console.error("Setup failed:", err);
  process.exit(1);
});
