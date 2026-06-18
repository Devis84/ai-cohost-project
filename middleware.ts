import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { user, supabaseResponse } = await updateSession(request)

  const isProtectedRoute = pathname.startsWith('/dashboard')

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return Response.redirect(loginUrl)
  }

  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  if (isAuthRoute && user) {
    return Response.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
}