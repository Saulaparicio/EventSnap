import NextAuth from 'next-auth'
import { authConfig } from './lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const adminRoutes = ['/dashboard', '/events']
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r))

  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*'],
}
