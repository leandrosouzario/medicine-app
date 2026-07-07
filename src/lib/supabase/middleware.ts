import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getCookieOptions } from './cookie-options'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
      cookieOptions: getCookieOptions(),
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? ''

    if (loginUrl) {
      const redirectUrl = new URL(loginUrl)
      const returnTo = siteUrl
        ? new URL(request.nextUrl.pathname + request.nextUrl.search, siteUrl).toString()
        : request.nextUrl.pathname
      redirectUrl.searchParams.set('next', returnTo)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
