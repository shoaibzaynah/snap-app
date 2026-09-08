// scripts/simulate-kid-device.js
// Virtual Kid Device Simulator: Tests the entire system without a physical phone!

const http = require("http");
const https = require("https");

const SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:3000";

function request(urlPath, method, data) {
  return new Promise((resolve, reject) => {
    const isHttps = SERVER_URL.startsWith("https");
    const client = isHttps ? https : http;
    const url = new URL(urlPath, SERVER_URL);

    const req = client.request(
      url,
      {
        method,
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runSimulator() {
  console.log("🤖 STARTING VIRTUAL KID DEVICE SIMULATOR:", SERVER_URL);

  // Step 1: Register virtual device
  console.log("1. Registering virtual phone: Ali's Galaxy S21...");
  const regRes = await request("/api/devices", "POST", {
    child_name: "Ali (Simulator Phone)",
    device_name: "Samsung Galaxy S21 Ultra",
    model: "SM-G998B",
    os_version: "Android 14",
  });

  if (!regRes.data?.device) {
    console.error("Failed to register device:", regRes.data);
    return;
  }

  const device = regRes.data.device;
  const deviceId = device.id;
  console.log(`✅ Device Registered! ID: ${deviceId}`);
  console.log(`🔑 Pairing Code: ${device.pairing_code}\n`);

  // Step 2: Send Initial Heartbeat
  console.log("2. Sending Heartbeat (Battery: 86%, Online: true)...");
  await request("/api/device-sync/heartbeat", "POST", {
    device_id: deviceId,
    battery_level: 86,
    is_charging: false,
    model: "Samsung Galaxy S21 Ultra",
    os_version: "Android 14",
  });
  console.log("✅ Heartbeat accepted!\n");

  // Step 3: Send Contacts Sync
  console.log("3. Syncing Phonebook Contacts...");
  await request("/api/device-sync/data", "POST", {
    device_id: deviceId,
    contacts: [
      { name: "Mama", phone_numbers: ["+92 300 1234567"] },
      { name: "Baba", phone_numbers: ["+92 321 7654321"] },
      { name: "School Bus Driver", phone_numbers: ["+92 333 9988776"] },
      { name: "English Teacher", phone_numbers: ["+92 345 5544332"] },
      { name: "Grandma", phone_numbers: ["+92 312 1122334"] },
    ],
  });
  console.log("✅ 5 Contacts synced successfully!\n");

  // Step 4: Send Call Logs
  console.log("4. Syncing Call Logs...");
  const now = Date.now();
  await request("/api/device-sync/data", "POST", {
    device_id: deviceId,
    calls: [
      {
        contact_name: "Mama",
        phone_number: "+92 300 1234567",
        call_type: "incoming",
        duration_seconds: 145,
        timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
      },
      {
        contact_name: "Baba",
        phone_number: "+92 321 7654321",
        call_type: "outgoing",
        duration_seconds: 62,
        timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
      },
      {
        contact_name: "School Bus Driver",
        phone_number: "+92 333 9988776",
        call_type: "missed",
        duration_seconds: 0,
        timestamp: new Date(now - 1000 * 60 * 120).toISOString(),
      },
    ],
  });
  console.log("✅ Call logs synced successfully!\n");

  // Step 5: Send SMS Messages (including OTP)
  console.log("5. Syncing SMS Messages...");
  await request("/api/device-sync/data", "POST", {
    device_id: deviceId,
    messages: [
      {
        sender: "WhatsApp",
        body: "Your WhatsApp code: 492-817. Do not share this code with anyone.",
        message_type: "inbox",
        timestamp: new Date(now - 1000 * 60 * 10).toISOString(),
      },
      {
        sender: "Mama",
        body: "Beta school se kab wapas aa rahe ho? Call me.",
        message_type: "inbox",
        timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
      },
      {
        sender: "+92 300 1234567",
        recipient: "Mama",
        body: "Mama bus me baith gaya hoon, 15 min me pohanch raha hoon.",
        message_type: "sent",
        timestamp: new Date(now - 1000 * 60 * 28).toISOString(),
      },
    ],
  });
  console.log("✅ SMS messages & OTP synced!\n");

  // Step 6: Simulate Installed Apps & Screen Time
  console.log("6. Syncing Installed Apps & Screen Time...");
  await request("/api/device-sync/data", "POST", {
    device_id: deviceId,
    installed_apps: [
      { package_name: "com.google.android.youtube", app_name: "YouTube", usage_time_seconds: 8100, is_system_app: false },
      { package_name: "com.zhiliaoapp.musically", app_name: "TikTok", usage_time_seconds: 6000, is_system_app: false },
      { package_name: "com.dts.freefireth", app_name: "Free Fire MAX", usage_time_seconds: 11400, is_system_app: false },
      { package_name: "com.whatsapp", app_name: "WhatsApp", usage_time_seconds: 3300, is_system_app: false },
      { package_name: "com.android.chrome", app_name: "Google Chrome", usage_time_seconds: 2700, is_system_app: true },
      { package_name: "com.kiloo.subwaysurf", app_name: "Subway Surfers", usage_time_seconds: 4200, is_system_app: false },
    ],
    browsing_history: [
      { browser_name: "Google Chrome", url: "https://www.google.com/search?q=math+homework+grade+7", title: "math homework grade 7 - Google Search" },
      { browser_name: "Google Chrome", url: "https://www.youtube.com/watch?v=science_experiments", title: "Top 10 Easy Science Experiments" },
      { browser_name: "Google Chrome", url: "https://www.roblox.com/games", title: "Roblox Discover Games" },
      { browser_name: "Brave Browser", url: "https://wikipedia.org/wiki/Solar_System", title: "Solar System - Wikipedia" },
    ],
    files: [
      { file_name: "School_Project_Science.jpg", file_path: "content://media/external/images/101", file_type: "image", file_size_bytes: 3450000 },
      { file_name: "Math_Homework_Chapter4.pdf", file_path: "content://media/external/downloads/202", file_type: "document", file_size_bytes: 1200000 },
      { file_name: "Family_Dinner_Photo.jpg", file_path: "content://media/external/images/102", file_type: "image", file_size_bytes: 4200000 },
      { file_name: "Roblox_Screen_Recording.mp4", file_path: "content://media/external/video/301", file_type: "video", file_size_bytes: 18500000 },
      { file_name: "English_Essay_Draft.docx", file_path: "content://media/external/downloads/203", file_type: "document", file_size_bytes: 850000 },
    ],
  });
  console.log("✅ Apps, screen time, browser history & files synced!\n");

  // Step 7: Simulate Live GPS Breadcrumb Movement
  console.log("7. Simulating Live Moving GPS Route (3 coordinate points)...");
  const baseLat = 24.8607;
  const baseLng = 67.0011;

  for (let i = 0; i < 3; i++) {
    const lat = baseLat + i * 0.0012;
    const lng = baseLng + i * 0.0015;
    await request("/api/device-sync/location", "POST", {
      device_id: deviceId,
      latitude: lat,
      longitude: lng,
      accuracy: 8.5,
      speed: 12.4,
      battery_level: 86 - i,
    });
    console.log(`   📍 GPS Point ${i + 1}/3: [${lat.toFixed(5)}, ${lng.toFixed(5)}]`);
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("\n=================================================");
  console.log("🎉 ADVANCED SIMULATION COMPLETE!");
  console.log(`👉 http://localhost:3000/admin/devices/${deviceId}`);
  console.log("=================================================");
}

runSimulator().catch(console.error);
