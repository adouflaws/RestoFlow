import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAuth = path.startsWith('/login')
  const isDashboard = path.startsWith('/dashboard') || path === '/'

  const token = request.cookies.get('sb-access-token')?.value ||
                request.cookies.getAll().find(c => c.name.includes('auth-token'))?.value

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
