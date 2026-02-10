import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const session = await auth()
        if (!session?.user?.id || session.user.role === 'PENDING') {
          throw new Error('Unauthorized')
        }

        const payload = JSON.parse(clientPayload || '{}') as { projectId?: string }
        const projectId = payload.projectId
        if (!projectId) {
          throw new Error('Missing projectId')
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } })
        const isAdmin = session.user.role === 'ADMIN'
        if (!project || (!isAdmin && project.userId !== session.user.id)) {
          throw new Error('Project not found')
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ projectId }),
        }
      },
      // We persist DB metadata from the client in /api/upload after upload finishes.
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload token generation failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
