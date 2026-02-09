'use server'

import { signIn, auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { AuthError } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

type ActionState = { error: string | null }
type ActionStateWithSuccess = { error: string | null; success: boolean }

export async function loginUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return { error: 'Invalid email or password.' }
      }
      return { error: 'Something went wrong. Please try again.' }
    }
    throw error
  }

  return { error: null }
}

export async function registerUser(
  _prevState: ActionStateWithSuccess,
  formData: FormData
): Promise<ActionStateWithSuccess> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!name || !email || !password || !confirmPassword) {
    return { error: 'All fields are required.', success: false }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.', success: false }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.', success: false }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'An account with this email already exists.', success: false }
  }

  const passwordHash = await hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'PENDING',
    },
  })

  return {
    error: null,
    success: true,
  }
}

// --- Password Change (for logged-in users) ---

export async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' }
  }

  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' }
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: 'User not found.' }

  const isValid = await compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return { error: 'Current password is incorrect.' }
  }

  const passwordHash = await hash(newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  })

  revalidatePath('/dashboard/profile')
  return { error: null }
}

// --- Password Reset Token Generation (admin can generate for any user) ---

export async function generateResetToken(
  _prevState: ActionState & { token?: string; resetUrl?: string },
  formData: FormData
): Promise<ActionState & { token?: string; resetUrl?: string }> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { error: 'Missing user ID.' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User not found.' }

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId, used: false },
    data: { used: true },
  })

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.passwordResetToken.create({
    data: { userId, token, expires },
  })

  return {
    error: null,
    token,
    resetUrl: `/reset-password?token=${token}`,
  }
}

// --- Password Reset (using token, no auth required) ---

export async function resetPassword(
  _prevState: ActionStateWithSuccess,
  formData: FormData
): Promise<ActionStateWithSuccess> {
  const token = formData.get('token') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!token || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.', success: false }
  }

  if (newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters.', success: false }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.', success: false }
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetToken) {
    return { error: 'Invalid or expired reset link.', success: false }
  }

  if (resetToken.used) {
    return { error: 'This reset link has already been used.', success: false }
  }

  if (resetToken.expires < new Date()) {
    return { error: 'This reset link has expired. Please request a new one.', success: false }
  }

  const passwordHash = await hash(newPassword, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ])

  return { error: null, success: true }
}
