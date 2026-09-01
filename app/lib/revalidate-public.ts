import { revalidatePath } from 'next/cache'
import { slugify } from './utils'

/**
 * Revalidate the public ISR pages affected by a change to a project's
 * content or visibility. Safe to call from server actions and route handlers.
 */
export function revalidatePublicProject(
  townName: string,
  year: number,
  photographer?: string | null
) {
  const townSlug = slugify(townName)
  revalidatePath('/')
  revalidatePath(`/towns/${townSlug}`)
  revalidatePath(`/towns/${townSlug}/${year}`)
  if (photographer) {
    revalidatePath(`/photographers/${slugify(photographer)}`)
  }
}
