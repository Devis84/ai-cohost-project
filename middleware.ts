import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true'

const protectedRoutes = [
  '/dashboard',
  '/host',
  '/admin',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!AUTH_ENABLED) {
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

  if (authCookie === 'true') {
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