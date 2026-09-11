import { Metadata } from "next";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { SnapViewerClient } from "./SnapViewerClient";
import { SnapStateView } from "@/components/viewer/SnapStates";
import { getSnapImageUrl } from "@/lib/storage";
import { getPlatformBranding } from "@/lib/branding";
import { formatSocialTitle, formatSocialDescription } from "@/lib/text-utils";
import { ImageLink } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const branding = getPlatformBranding(link?.target_url, link?.og_platform);
  const rawTitle = link?.og_title || link?.title;
  const baseTitle = rawTitle ? formatSocialTitle(rawTitle) : (branding.isSnap ? "SNAP APP Story" : `${branding.name} Content`);
  const rawDesc = link?.og_description || link?.description;
  const baseDesc = rawDesc ? formatSocialDescription(rawDesc) : `View this content on ${branding.name}`;

  const headerList = headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "https";
  const siteUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "https://snap-app-chi.vercel.app");

  let imageUrl = branding.isSnap
    ? `${siteUrl}/LOGO.svg`
    : (branding.logoUrl.startsWith("http") ? branding.logoUrl : `${siteUrl}${branding.logoUrl}`);

  if (link?.image_path) {
    imageUrl = `${siteUrl}/api/image?path=${encodeURIComponent(link.image_path)}`;
  } else if (link?.og_image_url) {
    if (link.og_image_url.includes("supabase.co/storage")) {
      const match = link.og_image_url.match(/snap-images\/(.+)$/);
      imageUrl = match && match[1] ? `${siteUrl}/api/image?path=${encodeURIComponent(match[1])}` : link.og_image_url;
    } else if (link.og_image_url.startsWith("/")) {
      imageUrl = `${siteUrl}${link.og_image_url}`;
    } else if (link.og_image_url.startsWith("http://") || link.og_image_url.startsWith("https://")) {
      // Proxy external social thumbnails (TikTok/Insta/FB) to bypass hotlink blocking on WhatsApp crawlers
      imageUrl = `${siteUrl}/api/image?url=${encodeURIComponent(link.og_image_url)}`;
    } else {
      imageUrl = link.og_image_url;
    }
  }

  const isVideo = link?.og_platform === "youtube" || link?.og_platform === "tiktok";
  const iconUrl = branding.faviconUrl.startsWith("http")
    ? branding.faviconUrl
    : `${siteUrl}${branding.faviconUrl}`;

  return {
    title: `${baseTitle} | ${branding.name}`,
    description: baseDesc,
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
    openGraph: {
      title: baseTitle,
      description: baseDesc,
      siteName: branding.name,
      type: isVideo ? "video.other" : "website",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: baseTitle,
          type: imageUrl.endsWith(".png") ? "image/png" : "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: baseTitle,
      description: baseDesc,
      images: [imageUrl],
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
