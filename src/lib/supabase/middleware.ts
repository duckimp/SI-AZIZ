import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isLoginPage = pathname === '/login'
  const isAdminPage = pathname.startsWith('/admin')
  const isGuruPage = pathname.startsWith('/guru')
  const isProtected = isAdminPage || isGuruPage
  const isRoot = pathname === '/'

  // Redirect logged-in user away from login page — always to /guru
  // Role-based redirect is handled by LoginForm (client-side) and page-level checks
  if (isLoginPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/guru'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated user to login
  if ((isProtected || isRoot) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect root to guru dashboard
  if (isRoot && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/guru'
    return NextResponse.redirect(url)
  }

  // Validate admin access — delegated to page-level check using admin client
  // Middleware cannot use service role key in Edge Runtime

  // IMPORTANT: return supabaseResponse to ensure cookies are properly forwarded
  return supabaseResponse
}
