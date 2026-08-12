import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function redirectWithCookies(url: URL, cookies: CookieToSet[]) {
  const response = NextResponse.redirect(url);
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0"
  );
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function safeNextUrl(next: string | null, origin: string) {
  const defaultUrl = new URL("/subscriptions", origin);

  if (!next) {
    return defaultUrl;
  }

  try {
    const nextUrl = new URL(next, origin);
    return nextUrl.origin === origin ? nextUrl : defaultUrl;
  } catch {
    return defaultUrl;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextUrl = safeNextUrl(searchParams.get("next"), origin);
  const authError = searchParams.get("error");
  const authDescription = searchParams.get("error_description");

  const loginUrl = new URL("/login", origin);

  if (authError) {
    loginUrl.searchParams.set("error", "link_expired_or_invalid");
    if (authDescription) {
      loginUrl.searchParams.set("error_description", authDescription);
    }
    return redirectWithCookies(loginUrl, []);
  }

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectWithCookies(nextUrl, cookiesToSet);
    }

    loginUrl.searchParams.set("error", "link_expired_or_invalid");
    loginUrl.searchParams.set("error_description", error.message);
    return redirectWithCookies(loginUrl, []);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email" | "magiclink",
      token_hash: tokenHash,
    });

    if (!error) {
      return redirectWithCookies(nextUrl, cookiesToSet);
    }

    loginUrl.searchParams.set("error", "link_expired_or_invalid");
    loginUrl.searchParams.set("error_description", error.message);
    return redirectWithCookies(loginUrl, []);
  }

  loginUrl.searchParams.set("error", "link_expired_or_invalid");
  loginUrl.searchParams.set(
    "error_description",
    "Sign-in link was missing a code. Request a new magic link."
  );
  return redirectWithCookies(loginUrl, []);
}
