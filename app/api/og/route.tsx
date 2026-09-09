import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSnapImageUrl } from "@/lib/storage";
import { getPlatformBranding } from "@/lib/branding";
import { formatSocialTitle } from "@/lib/text-utils";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    let title = "Shared Content";
    let rawImageUrl: string | null = null;
    let targetUrl: string | null = null;

    if (slug) {
      const admin = createAdminClient();
      const { data: link } = await admin
        .from("image_links")
        .select("title, og_title, og_image_url, image_path, target_url")
        .eq("slug", slug)
        .single();

      if (link) {
        title = formatSocialTitle(link.og_title || link.title || "Shared Content");
        rawImageUrl = link.og_image_url || (link.image_path ? getSnapImageUrl(link.image_path) : null);
        targetUrl = link.target_url || null;
      }
    }

    const branding = getPlatformBranding(targetUrl);
    const brandColor = branding.brandColor || "#FFFC00";
    const isLightColor = brandColor === "#FFFC00";
    const btnTextColor = isLightColor ? "#000000" : "#FFFFFF";

    let centerIcon = "⚡";
    if (branding.name === "YouTube") centerIcon = "▶";
    else if (branding.name === "TikTok") centerIcon = "🎵";
    else if (branding.name === "Instagram") centerIcon = "📸";
    else if (branding.isSnap) centerIcon = "👻";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: "#0B0B0E",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          {/* Full-bleed real image with slight blur (7px) */}
          {rawImageUrl && (
            <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
              <defs>
                <filter id="blurFilter"><feGaussianBlur stdDeviation="7" /></filter>
              </defs>
              <image href={rawImageUrl} width="1200" height="630" preserveAspectRatio="xMidYMid slice" filter="url(#blurFilter)" />
            </svg>
          )}

          {/* Dark gradient overlay for text contrast */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 100%)" }} />

          {/* Top-Right Platform Tag */}
          <div
            style={{
              position: "absolute",
              top: 28,
              right: 32,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 999,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              border: `1.5px solid ${brandColor}`,
              color: brandColor,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            <span>{branding.badgeText}</span>
          </div>

          {/* Center Play / Unlock Ring in Platform Color */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              border: `2.5px solid ${brandColor}`,
              boxShadow: `0 0 35px ${brandColor}80`,
              color: brandColor,
              fontSize: 38,
            }}
          >
            {centerIcon}
          </div>

          {/* Bottom Bar: Title & Platform Action Button */}
          <div
            style={{
              position: "absolute",
              bottom: 28,
              left: 32,
              right: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: 750,
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  lineHeight: 1.2,
                  textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </div>
            </div>

            {/* Action Button: Dynamic according to platform */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 26px",
                borderRadius: 999,
                backgroundColor: brandColor,
                color: btnTextColor,
                fontSize: 17,
                fontWeight: 800,
                boxShadow: `0 4px 20px ${brandColor}55`,
              }}
            >
              <span>{branding.actionText}</span>
              <span style={{ fontSize: 19 }}>↗</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (err: any) {
    return new Response(`Failed to generate OG image: ${err.message}`, { status: 500 });
  }
}
