"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("shoaibzaynah@gmail.com");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        throw authErr;
      }

      const expectedAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "shoaibzaynah@gmail.com";
      if (data.user?.email !== expectedAdmin) {
        throw new Error(`Unauthorized: User ${data.user?.email} is not designated admin`);
      }

      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-md p-8 text-center border-white/10">
        {/* Glowing Snapchat Ghost Icon */}
        <div className="w-16 h-16 rounded-full p-1 bg-[#FFFC00] shadow-[0_0_30px_rgba(255,252,0,0.5)] mx-auto mb-5 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-2">
            <Image
              src="/LOGO.svg"
              alt="SNAP APP Ghost Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          SNAP APP <span className="text-[#FFFC00]">Admin</span>
        </h1>
        <p className="text-xs text-white/50 mb-6">
          Sign in with authorized administrator credentials
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <Input
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@example.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter password"
          />

          <Button type="submit" isLoading={isLoading} size="lg" className="w-full mt-2">
            Sign In to Dashboard
          </Button>
        </form>

        <p className="text-[11px] text-white/40 mt-6">
          Secured with Supabase Auth & Row Level Security
        </p>
      </Card>
    </div>
  );
}
