// lib/webpush.ts
// Server-side Web Push VAPID key manager and notification dispatcher
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

let cachedVapidKeys: VapidKeys | null = null;

export async function getOrGenerateVapidKeys(): Promise<VapidKeys> {
  if (cachedVapidKeys) return cachedVapidKeys;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", "web_push_vapid")
    .maybeSingle();

  if (row?.value && (row.value as any).publicKey && (row.value as any).privateKey) {
    cachedVapidKeys = row.value as unknown as VapidKeys;
    return cachedVapidKeys;
  }

  // Generate new standard VAPID keypair
  const generated = webpush.generateVAPIDKeys();
  await admin.from("admin_settings").upsert({
    key: "web_push_vapid",
    value: generated,
    updated_at: new Date().toISOString(),
  });

  cachedVapidKeys = generated;
  return generated;
}

export async function sendWebPushNotification(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url: string; icon?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const keys = await getOrGenerateVapidKeys();
    webpush.setVapidDetails(
      "mailto:shoaibzaynah@gmail.com",
      keys.publicKey,
      keys.privateKey
    );

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url,
        icon: payload.icon || "/LOGO.svg",
      })
    );

    return { success: true };
  } catch (err: any) {
    console.error("WebPush delivery failed:", err);
    return { success: false, error: err.message || "Failed to deliver push notification" };
  }
}
