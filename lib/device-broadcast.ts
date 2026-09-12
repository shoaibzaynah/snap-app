// lib/device-broadcast.ts
import { createAdminClient } from "@/lib/supabase/admin";

export async function broadcastDeviceEvent(
  deviceId: string,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  if (!deviceId) return;
  try {
    const admin = createAdminClient();
    const channel = admin.channel(`device:${deviceId}`);
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout);
          channel
            .send({
              type: "broadcast",
              event,
              payload: { ...payload, device_id: deviceId, timestamp: new Date().toISOString() },
            })
            .then(() => resolve())
            .catch(() => resolve());
        }
      });
    });
    admin.removeChannel(channel);
  } catch (ignored) {}
}
