// scripts/setup-github-secrets.js
const fs = require("fs");
const https = require("https");
const sodium = require("tweetsodium");

// Parse .env.local safely
function loadEnv() {
  const env = {};
  if (!fs.existsSync(".env.local")) return env;
  const content = fs.readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^[\"']|[\"']$/g, "");
      env[key] = val;
    }
  }
  return env;
}

function githubRequest(path, method, token, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: "api.github.com",
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SnapApp-Secrets-Setup",
          ...(data
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
              }
            : {}),
        },
      },
      (res) => {
        let resBody = "";
        res.on("data", (chunk) => (resBody += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(resBody ? JSON.parse(resBody) : {});
          } else {
            reject(
              new Error(`GitHub API ${method} ${path} failed (${res.statusCode}): ${resBody}`)
            );
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const env = loadEnv();
  const token = env.GITHUB_TOKEN;
  const owner = "shoaibzaynah";
  const repo = "snap-app";

  if (!token) {
    console.error("❌ GITHUB_TOKEN not found in .env.local");
    process.exit(1);
  }

  console.log("🔑 Fetching GitHub repository public key for secrets encryption...");
  const pubKeyData = await githubRequest(
    `/repos/${owner}/${repo}/actions/secrets/public-key`,
    "GET",
    token
  );
  const { key_id, key } = pubKeyData;
  console.log("✅ Retrieved repository public key ID:", key_id);

  const appUrl =
    env.NEXT_PUBLIC_APP_URL && !env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? env.NEXT_PUBLIC_APP_URL
      : "https://snap-app-chi.vercel.app";

  const secretsToSet = {
    SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    APP_URL: appUrl,
  };

  const keyBytes = Buffer.from(key, "base64");

  for (const [name, secretValue] of Object.entries(secretsToSet)) {
    if (!secretValue) {
      console.warn(`⚠️ Skipping ${name}: not found in .env.local`);
      continue;
    }

    const messageBytes = Buffer.from(secretValue);
    const encryptedBytes = sodium.seal(messageBytes, keyBytes);
    const encryptedValue = Buffer.from(encryptedBytes).toString("base64");

    await githubRequest(
      `/repos/${owner}/${repo}/actions/secrets/${name}`,
      "PUT",
      token,
      {
        encrypted_value: encryptedValue,
        key_id: key_id,
      }
    );
    console.log(`✅ GitHub Actions Secret successfully set: ${name}`);
  }

  // Verify list of secrets
  const listData = await githubRequest(
    `/repos/${owner}/${repo}/actions/secrets`,
    "GET",
    token
  );
  console.log(
    "📋 Currently active GitHub Actions secrets:",
    listData.secrets.map((s) => s.name).join(", ")
  );
}

main().catch((err) => {
  console.error("❌ Error setting secrets:", err.message);
  process.exit(1);
});
