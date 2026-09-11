// lib/ip-lookup.ts
// Real-time IP-to-ISP, Mobile Carrier & Cellular Network Detector

export interface IpLookupResult {
  isp?: string;
  carrier?: string;
  isCellular?: boolean;
  city?: string;
  country?: string;
  region?: string;
}

export async function lookupIpCarrier(ip: string): Promise<IpLookupResult> {
  if (
    !ip ||
    ip === "Unknown IP" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  ) {
    return {};
  }

  // Attempt primary fast lookup via ip-api.com
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,as,asname,mobile`,
      { signal: controller.signal, headers: { "User-Agent": "SnapApp/1.0" } }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const ispName = data.isp || data.org || data.asname || "";
        const isMobile = Boolean(data.mobile);
        return {
          isp: ispName,
          carrier: ispName,
          isCellular: isMobile,
          city: data.city,
          country: data.country,
          region: data.regionName,
        };
      }
    }
  } catch {
    // Timeout or network glitch, fall back to secondary
  }

  // Fallback to ipwho.is
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`https://ipwho.is/${ip}`, {
      signal: controller.signal,
      headers: { "User-Agent": "SnapApp/1.0" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const ispName = data.connection?.isp || data.connection?.org || "";
        return {
          isp: ispName,
          carrier: ispName,
          city: data.city,
          country: data.country,
          region: data.region,
        };
      }
    }
  } catch {
    // Both timed out or failed
  }

  return {};
}
