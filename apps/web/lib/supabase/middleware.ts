import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";



export async function updateSession(request: NextRequest) {

  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_PUBLIC_URL,
    process.env.SUPABASE_PUBLIC_KEY,
    {
      auth: { storageKey: "train360-dms" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // 🚨 Do not insert logic between createClient and getClaims
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Redirect unauthenticated users to /auth/login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return response;
}