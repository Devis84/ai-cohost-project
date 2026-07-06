import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_REQUIRED =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true'

const protectedRoutes = [
  '/dashboard',
  '/host',
  '/admin',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!AUTH_REQUIRED) {
    return NextResponse.next()
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  const authCookie =
    request.cookies.get('ai_cohost_auth')?.value

  const emailCookie =
    request.cookies.get('ai_cohost_user_email')?.value

  if (authCookie === 'true' && emailCookie) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/host/:path*',
    '/admin/:path*',
  ],
}