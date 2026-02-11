'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { deleteFromR2, isR2Configured } from '@/lib/storage/r2'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'

type ProfileActionState = { error: string | null; success: boolean }

export async function updatePhotographerProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized', success: false }

  const bio = (formData.get('bio') as string | null)?.trim() || null
  const website = (formData.get('website') as string | null)?.trim() || null
  const location = (formData.get('location') as string | null)?.trim() || null
  const profilePhotoUrl = (formData.get('profilePhotoUrl') as string | null)?.trim() || null

  if (website) {
    try {
      const parsed = new URL(website)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { error: 'Website URL must use http:// or https://', success: false }
      }
    } catch {
      return { error: 'Website URL is invalid.', success: false }
    }
  }

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, profilePhotoUrl: true },
  })
  if (!current) return { error: 'User not found.', success: false }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      bio,
      website,
      location,
      profilePhotoUrl,
    },
  })

  // Keep storage tidy when a previous R2 profile photo is replaced or removed.
  if (
    isR2Configured() &&
    current.profilePhotoUrl &&
    current.profilePhotoUrl !== profilePhotoUrl
  ) {
    try {
      await deleteFromR2(current.profilePhotoUrl)
    } catch {
      // Ignore deletion failures (missing object, transient errors).
    }
  }

  revalidatePath('/dashboard/profile')
  revalidatePath(`/photographers/${slugify(current.name)}`)

  return { error: null, success: true }
}
