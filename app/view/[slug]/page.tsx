import { Metadata } from "next";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { SnapViewerClient } from "./SnapViewerClient";
import { SnapStateView } from "@/components/viewer/SnapStates";
import { getSnapImageUrl } from "@/lib/storage";
import { getPlatformBranding } from "@/lib/branding";
import { ImageLink } from "@/lib/types";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const admin = createAdminClient();
  const { data: rawLink } = await admin
    .from("image_links")
    .select("*")
    .eq("slug", params.slug)
    .single();

  const link = rawLink as ImageLink | null;
  const branding = getPlatformBranding(link?.target_url);
  const baseTitle = link?.og_title || link?.title || (branding.isSnap ? "SNAP APP Story" : `${branding.name} Content`);
  const baseDesc = link?.og_description || link?.description || `View this content on ${branding.name}`;

  // Dynamically resolve actual public site URL from request headers (prevents localhost:3000 in production)
  let siteUrl = "https://snap-app-chi.vercel.app";
  try {
    const headersList = headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    if (host) {
      const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      siteUrl = `${proto}://${host}`;
    }
  } catch {
    // fallback if headers not available
  }

  // Slightly blurred real photo teaser card
  const ogImageUrl = `${siteUrl}/api/og?slug=${params.slug}`;
  const isVideo = link?.og_platform === "youtube" || link?.og_platform === "tiktok";

  return {
    title: `${baseTitle} | ${branding.name}`,
    description: baseDesc,
    icons: {
      icon: branding.faviconUrl,
      shortcut: branding.faviconUrl,
      apple: branding.faviconUrl,
    },
    openGraph: {
      title: baseTitle,
      description: baseDesc,
      siteName: branding.name,
      type: isVideo ? "video.other" : "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: baseTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: baseTitle,
      description: baseDesc,
      images: [ogImageUrl],
    },
  };
}

export default async function ViewSnapPage({ params }: PageProps) {
  const { slug } = params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("image_links")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main className="w-full min-h-[100dvh] bg-black flex items-center justify-center p-4">
        <SnapStateView type="not_found" />
      </main>
    );
  }

  const link = data as ImageLink;

  if (!link.is_active) {
    return (
      <main className="w-full min-h-[100dvh] bg-black flex items-center justify-center p-4">
        <SnapStateView type="inactive" />
      </main>
    );
  }

  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return (
      <main className="w-full min-h-[100dvh] bg-black flex items-center justify-center p-4">
        <SnapStateView type="expired" />
      </main>
    );
  }

  return <SnapViewerClient link={link} />;
}
