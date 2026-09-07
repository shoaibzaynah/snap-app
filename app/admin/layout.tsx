import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get("x-pathname") || "";
  const isLoginPage = pathname === "/admin/login";

  // Render standalone full-screen login card on /admin/login
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Strict server-side verification: only authenticated ADMIN_EMAIL allowed
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "shoaibzaynah@gmail.com";

  if (!user || user.email !== adminEmail) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#070709] text-white">
      <AdminNav />
      <main className="flex-1 p-4 sm:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
