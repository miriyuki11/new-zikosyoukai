import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function shouldBypassAuth(pathname: string) {
    const isPublicProfile = /^\/profile\/[^/]+$/.test(pathname)
        && pathname !== "/profile/settings"
        && pathname !== "/profile/edit";
    const isPublicTeam = /^\/team\/[^/]+$/.test(pathname);
    const isPublicTeamsProfile = /^\/teams\/[^/]+$/.test(pathname)
        && pathname !== "/teams/create";

    return isPublicProfile || isPublicTeam || isPublicTeamsProfile;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (shouldBypassAuth(pathname)) {
        return NextResponse.next({ request });
    }

    // 静的画像やアセット
    if (/\.(jpg|jpeg|png|gif|svg|ico|webp)$/i.test(pathname) || pathname.startsWith('/images/')) {
        return NextResponse.next({ request });
    }

    let response = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables.");
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });

                response = NextResponse.next({ request });

                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";

        const redirectResponse = NextResponse.redirect(loginUrl);

        response.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie);
        });

        return redirectResponse;
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!api|login|auth|test-auth|test-profile-card|_next/static|_next/image|images|favicon.ico).*)",
    ],
};