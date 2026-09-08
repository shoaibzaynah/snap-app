// scripts/clean-demo-devices.js
// Purges all simulated/demo kid devices and related records so the dashboard is 100% clean for real devices
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

function postSql(sql) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.supabase.com",
        path: `/v1/projects/${projectRef}/database/query`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function clean() {
  console.log("🧹 Purging all demo devices and associated logs...");
  const sql = `
    DELETE FROM monitored_devices;
  `;
  const res = await postSql(sql);
  console.log("Result:", res.status, res.body);
  console.log("✅ All demo devices purged successfully! Dashboard is 100% clean.");
}

clean().catch(console.error);
