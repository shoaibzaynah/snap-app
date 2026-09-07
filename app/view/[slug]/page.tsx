import { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SnapViewerClient } from "./SnapViewerClient";
import { SnapStateView } from "@/components/viewer/SnapStates";
import { getSnapImageUrl } from "@/lib/storage";
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
  const title = link?.og_title || link?.title || "SNAP APP Story";
  const description = link?.og_description || link?.description || "View this shared content on SNAP APP";

  let imageUrl = "/LOGO.svg";
  if (link?.og_image_url) {
    imageUrl = link.og_image_url;
  } else if (link?.image_path) {
    imageUrl = getSnapImageUrl(link.image_path);
  }

  const siteName = link?.og_platform && link.og_platform !== "custom"
    ? link.og_platform.charAt(0).toUpperCase() + link.og_platform.slice(1)
    : "SNAP APP";

  const isVideo = link?.og_platform === "youtube" || link?.og_platform === "tiktok";

  return {
    title: `${title} | ${siteName}`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      siteName: siteName,
      type: isVideo ? "video.other" : "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
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
