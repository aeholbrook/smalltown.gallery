// NextAuth.js v5 configuration
// Separated for edge compatibility

import type { NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: string
  }
}

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      } else if (isOnAdmin) {
        if (isLoggedIn && auth?.user?.role === 'ADMIN') return true
        return false
      } else if (isLoggedIn) {
        return true
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
