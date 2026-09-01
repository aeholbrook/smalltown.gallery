import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from './db'
import { authConfig } from './auth.config'

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

// How long a token may trust its cached role before re-reading it from the DB.
// Bounds the window in which an approved user stays PENDING (or a demoted
// admin stays ADMIN) to minutes instead of the 30-day token lifetime.
const ROLE_REFRESH_MS = 5 * 60 * 1000

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roleCheckedAt = Date.now()
        return token
      }

      const checkedAt = typeof token.roleCheckedAt === 'number' ? token.roleCheckedAt : 0
      if (token.id && Date.now() - checkedAt > ROLE_REFRESH_MS) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (!dbUser) return null // user deleted/rejected — invalidate the session
        token.role = dbUser.role
        token.roleCheckedAt = Date.now()
      }
      return token
    },
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) return null

        const isValid = await compare(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
})
