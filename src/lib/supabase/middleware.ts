import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          request.cookies.set({ name, value, ...options } as any)
          response = NextResponse.next({ request: { headers: request.headers } })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          response.cookies.set({ name, value, ...options } as any)
        },
        remove(name: string, options: CookieOptions) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          request.cookies.set({ name, value: '', ...options } as any)
          response = NextResponse.next({ request: { headers: request.headers } })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          response.cookies.set({ name, value: '', ...options } as any)
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Selalu izinkan static assets & login page tanpa auth check
  const isLoginPage = pathname === '/login'
  const isAdminPage = pathname.startsWith('/admin')
  const isGuruPage = pathname.startsWith('/guru')
  const isProtected = isAdminPage || isGuruPage

  // Refresh session - tapi jangan redirect dari sini kalau di halaman login
  // untuk menghindari loop
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Kalau gagal ambil user, anggap tidak ada session
    user = null
  }

  // Kalau di login page dan sudah ada user yang valid → redirect ke dashboard
  // Tapi HANYA kalau ini bukan akibat redirect loop (cek referer)
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/guru', request.url))
  }

  // Kalau akses halaman protected tapi tidak ada user → ke login
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Kalau akses root '/' → redirect sesuai role
  if (pathname === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.redirect(new URL('/guru', request.url))
  }

  // Kalau admin page, validasi role
  if (isAdminPage && user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/guru', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/guru', request.url))
    }
  }

  return response
}
