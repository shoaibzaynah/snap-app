import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSnapImageUrl } from "@/lib/storage";
import { getPlatformBranding } from "@/lib/branding";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    let title = "Private Snap";
    let subtitle = "Tap to unlock and view this content";
    let rawImageUrl: string | null = null;
    let targetUrl: string | null = null;

    if (slug) {
      const admin = createAdminClient();
      const { data: link } = await admin
        .from("image_links")
        .select("title, og_title, og_description, og_image_url, image_path, target_url")
        .eq("slug", slug)
        .single();

      if (link) {
        title = link.og_title || link.title || "Private Content";
        subtitle = link.og_description || "Tap to unlock and view this content";
        rawImageUrl = link.og_image_url || (link.image_path ? getSnapImageUrl(link.image_path) : null);
        targetUrl = link.target_url || null;
      }
    }

    const branding = getPlatformBranding(targetUrl);
    const brandColor = branding.brandColor || "#FFFC00";
    const isLightColor = brandColor === "#FFFC00";
    const btnTextColor = isLightColor ? "#000000" : "#FFFFFF";

    let centerIcon = "🔒";
    if (branding.name === "YouTube") centerIcon = "▶";
    else if (branding.name === "TikTok") centerIcon = "🎵";
    else if (branding.name === "Instagram") centerIcon = "📸";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0B0B0E",
            position: "relative",
            fontFamily: "sans-serif",
          }}
        >
          {/* Teaser Background Image (dimmed & overlaid) */}
          {rawImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rawImageUrl}
              alt="Teaser"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.28,
              }}
            />
          )}

          {/* Frosted Dark Gradient Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at center, rgba(11,11,14,0.6) 0%, rgba(11,11,14,0.92) 100%)",
            }}
          />

          {/* Top Pill: Dynamic Platform Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 999,
              backgroundColor: `${brandColor}25`,
              border: `1.5px solid ${brandColor}80`,
              color: brandColor,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            <span>🔒 PRIVATE {branding.badgeText}</span>
          </div>

          {/* Glowing Centerpiece in Platform Color */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: brandColor,
              boxShadow: `0 0 50px ${brandColor}99, 0 0 100px ${brandColor}40`,
              marginBottom: 24,
              fontSize: 48,
              color: btnTextColor,
            }}
          >
            {centerIcon}
          </div>

          {/* Title with High Contrast */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: "#FFFFFF",
              textAlign: "center",
              maxWidth: 900,
              lineHeight: 1.2,
              marginBottom: 12,
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </div>

          {/* Subtitle / Teaser Prompt */}
          <div
            style={{
              fontSize: 22,
              color: "rgba(255, 255, 255, 0.75)",
              textAlign: "center",
              maxWidth: 750,
              marginBottom: 32,
              lineHeight: 1.4,
            }}
          >
            {subtitle.length > 90 ? `${subtitle.slice(0, 90)}...` : subtitle}
          </div>

          {/* Action Button: Dynamic Platform Action */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 36px",
              borderRadius: 999,
              backgroundColor: brandColor,
              color: btnTextColor,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 0.5,
              boxShadow: `0 8px 30px ${brandColor}55`,
            }}
          >
            <span>⚡ {branding.actionText}</span>
            <span style={{ fontSize: 22 }}>↗</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err: any) {
    return new Response(`Failed to generate OG image: ${err.message}`, { status: 500 });
  }
}
