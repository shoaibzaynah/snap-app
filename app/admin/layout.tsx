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
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-slate-100/70 dark:bg-[#070709] text-slate-900 dark:text-white">
      <AdminNav />
      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 flex flex-col scroll-pt-16">
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>
        {/* Mobile Safe Clearance Spacer: Guarantees zero content ever hides behind bottom footer nav */}
        <div className="h-28 md:hidden shrink-0 pointer-events-none" aria-hidden="true" />
      </main>
    </div>
  );
}
