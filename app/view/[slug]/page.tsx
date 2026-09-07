import { Metadata } from "next";
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

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  // High-attraction dynamic OpenGraph teaser card (blurred teaser + glowing lock + unlock CTA)
  const ogImageUrl = `${siteUrl}/api/og?slug=${params.slug}`;

  const catchyTitle = branding.isSnap
    ? `🔒 Private Snap: ${baseTitle}`
    : `🔒 Private ${branding.name}: ${baseTitle}`;
  const actionWord = link?.og_platform === "youtube" || link?.og_platform === "tiktok" ? "watch" : "view";
  const catchyDesc = `⚡ ${baseDesc} — Tap to ${actionWord} on ${branding.name}.`;

  const isVideo = link?.og_platform === "youtube" || link?.og_platform === "tiktok";

  return {
    title: `${catchyTitle} | ${branding.name}`,
    description: catchyDesc,
    icons: {
      icon: branding.faviconUrl,
      shortcut: branding.faviconUrl,
      apple: branding.faviconUrl,
    },
    openGraph: {
      title: catchyTitle,
      description: catchyDesc,
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
      title: catchyTitle,
      description: catchyDesc,
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
