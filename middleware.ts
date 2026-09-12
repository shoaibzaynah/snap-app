// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "shoaibzaynah@gmail.com";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.includes("-auth-token") || c.name.startsWith("sb-"));
  const isLoginPage = pathname === "/admin/login";

  // Fast-path: if zero auth cookies, redirect to login immediately with 0ms network latency
  if (!hasAuthCookie) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (pathname.startsWith("/admin") && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  let user: any = null;
  try {
    const userPromise = supabase.auth.getUser().then((r) => r.data?.user);
    const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 1200));
    user = await Promise.race([userPromise, timeoutPromise]);
  } catch {
    user = null;
  }

  const isAuthed = Boolean(user && user.email?.toLowerCase() === adminEmail.toLowerCase());

  // Root URL: If authed -> /admin, otherwise -> /admin/login
  if (pathname === "/") {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Accessing /admin/* (except /admin/login) without verified auth:
  // If user check resolved to false, redirect to login. If it timed out, let Node.js AdminLayout verify
  if (pathname.startsWith("/admin") && !isLoginPage) {
    if (user !== undefined && user === null && !hasAuthCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in and navigating to /admin/login -> redirect to /admin
  if (isLoginPage && isAuthed) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
  ],
};

