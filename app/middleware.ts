import NextAuth from 'next-auth'
import { authConfig } from './lib/auth.config'

// Use edge-compatible authConfig (no Prisma/bcrypt imports)
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
