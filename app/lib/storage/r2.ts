import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET = process.env.R2_BUCKET
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined)
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL

let client: S3Client | null = null

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function missingVars() {
  const missing: string[] = []
  if (!R2_BUCKET) missing.push('R2_BUCKET')
  if (!R2_ENDPOINT) missing.push('R2_ENDPOINT or R2_ACCOUNT_ID')
  if (!R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID')
  if (!R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY')
  return missing
}

export function isR2Configured() {
  return missingVars().length === 0
}

export function assertR2Configured() {
  const missing = missingVars()
  if (missing.length > 0) {
    throw new Error(`Missing R2 configuration: ${missing.join(', ')}`)
  }
}

function getClient() {
  assertR2Configured()
  if (client) return client

  client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID as string,
      secretAccessKey: R2_SECRET_ACCESS_KEY as string,
    },
  })

  return client
}

export function getR2PublicUrl(pathname: string) {
  const cleanPath = trimSlashes(pathname)
  if (R2_PUBLIC_BASE_URL) {
    return `${stripTrailingSlash(R2_PUBLIC_BASE_URL)}/${cleanPath}`
  }

  if (!R2_ENDPOINT || !R2_BUCKET) {
    throw new Error('Missing R2 endpoint/bucket to build public URL')
  }

  return `${stripTrailingSlash(R2_ENDPOINT)}/${R2_BUCKET}/${cleanPath}`
}

export async function uploadBufferToR2(params: {
  pathname: string
  body: Buffer | Uint8Array
  contentType: string
  cacheControl?: string
}) {
  const c = getClient()
  const pathname = trimSlashes(params.pathname)

  await c.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: pathname,
    Body: params.body,
    ContentType: params.contentType,
    CacheControl: params.cacheControl,
  }))

  return {
    pathname,
    url: getR2PublicUrl(pathname),
  }
}

export async function getR2SignedUploadUrl(params: {
  pathname: string
  contentType: string
  cacheControl?: string
  expiresIn?: number
}) {
  const c = getClient()
  const pathname = trimSlashes(params.pathname)
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: pathname,
    ContentType: params.contentType,
    CacheControl: params.cacheControl,
  })

  const signedUrl = await getSignedUrl(c, command, {
    expiresIn: params.expiresIn ?? 60 * 5,
  })

  return {
    pathname,
    url: getR2PublicUrl(pathname),
    signedUrl,
  }
}

function isNotFoundError(error: unknown) {
  if (!(error instanceof Error)) return false
  return (
    error.name === 'NotFound' ||
    error.name === 'NoSuchKey' ||
    error.name === 'NotFoundException' ||
    /not.?found/i.test(error.message)
  )
}

export async function r2ObjectExists(pathname: string) {
  const c = getClient()
  const key = trimSlashes(pathname)

  try {
    await c.send(new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }))
    return true
  } catch (error) {
    if (isNotFoundError(error)) return false
    throw error
  }
}

export function r2PathnameFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const path = trimSlashes(parsed.pathname)

    if (R2_PUBLIC_BASE_URL) {
      const publicBase = stripTrailingSlash(R2_PUBLIC_BASE_URL)
      if (url.startsWith(publicBase + '/')) {
        return trimSlashes(url.slice(publicBase.length + 1))
      }
    }

    if (R2_BUCKET && path.startsWith(`${R2_BUCKET}/`)) {
      return trimSlashes(path.slice(R2_BUCKET.length + 1))
    }

    return path
  } catch {
    return trimSlashes(url)
  }
}

export async function deleteFromR2(pathnameOrUrl: string) {
  const c = getClient()
  const key = r2PathnameFromUrl(pathnameOrUrl)
  if (!key) return

  await c.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  }))
}
