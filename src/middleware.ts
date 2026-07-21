import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Only run middleware on app routes, not on static files or API routes
     * that don't need auth checking.
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
