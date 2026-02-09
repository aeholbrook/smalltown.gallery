import NextAuth from 'next-auth'
import { authConfig } from './lib/auth.config'

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

// Use edge-compatible authConfig (no Prisma/bcrypt imports)
const { auth } = NextAuth({
  ...authConfig,
  secret: AUTH_SECRET,
})

export default auth

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
