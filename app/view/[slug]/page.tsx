import { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SnapViewerClient } from "./SnapViewerClient";
import { SnapStateView } from "@/components/viewer/SnapStates";
import { ImageLink } from "@/lib/types";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("image_links")
    .select("title, description")
    .eq("slug", params.slug)
    .single();

  return {
    title: link?.title ? `${link.title} | SNAP APP` : "View Snap | SNAP APP",
    description: link?.description || "A shared snap on SNAP APP",
    openGraph: {
      title: link?.title || "SNAP APP Story",
      description: "View this shared snap on SNAP APP",
      images: [{ url: "/LOGO.svg", width: 800, height: 800, alt: "SNAP APP" }],
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
