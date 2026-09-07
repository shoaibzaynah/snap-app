import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSnapImageUrl } from "@/lib/storage";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    let title = "Private Snap";
    let subtitle = "Tap to unlock and view this snap";
    let rawImageUrl: string | null = null;
    let platform = "Snapchat";

    if (slug) {
      const admin = createAdminClient();
      const { data: link } = await admin
        .from("image_links")
        .select("title, og_title, og_description, og_image_url, image_path, og_platform")
        .eq("slug", slug)
        .single();

      if (link) {
        title = link.og_title || link.title || "Private Snap";
        subtitle = link.og_description || "Tap to unlock and view this snap";
        rawImageUrl = link.og_image_url || (link.image_path ? getSnapImageUrl(link.image_path) : null);
        if (link.og_platform) {
          platform = link.og_platform.toUpperCase();
        }
      }
    }

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

          {/* Top Pill: Platform Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 999,
              backgroundColor: "rgba(255, 252, 0, 0.15)",
              border: "1.5px solid rgba(255, 252, 0, 0.5)",
              color: "#FFFC00",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            <span>🔒 PRIVATE {platform} SNAP</span>
          </div>

          {/* Glowing Lock Centerpiece */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#FFFC00",
              boxShadow: "0 0 50px rgba(255, 252, 0, 0.6), 0 0 100px rgba(255, 252, 0, 0.3)",
              marginBottom: 24,
              fontSize: 48,
            }}
          >
            🔒
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

          {/* Action Button: Tap to Unlock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 36px",
              borderRadius: 999,
              backgroundColor: "#FFFC00",
              color: "#000000",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 0.5,
              boxShadow: "0 8px 30px rgba(255, 252, 0, 0.35)",
            }}
          >
            <span>⚡ Tap to Unlock & View</span>
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
