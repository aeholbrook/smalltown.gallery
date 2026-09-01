// One-time backfill: set long-lived Cache-Control metadata on existing R2
// objects that were uploaded without it (the legacy/* imports). Objects
// without cache-control fall back to Cloudflare's 4-hour default edge TTL
// and get no browser caching, so every visit re-downloads full-size photos.
//
// Usage: npx tsx scripts/set-r2-cache-control.ts [prefix]
//   prefix defaults to "legacy/". Requires the same R2_* env vars as the app.
import 'dotenv/config'
import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET = process.env.R2_BUCKET
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined)
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY

const CACHE_CONTROL = 'public, max-age=31536000, immutable'

if (!R2_BUCKET || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error('Missing R2 configuration (R2_BUCKET, R2_ENDPOINT/R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)')
}

const client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

async function main() {
  const prefix = process.argv[2] || 'legacy/'
  let continuationToken: string | undefined
  let updated = 0
  let skipped = 0

  do {
    const page = await client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }))

    for (const object of page.Contents ?? []) {
      const key = object.Key
      if (!key) continue

      const head = await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
      if (head.CacheControl === CACHE_CONTROL) {
        skipped++
        continue
      }

      // Copy-onto-itself with REPLACE rewrites metadata in place.
      await client.send(new CopyObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        CopySource: `${R2_BUCKET}/${encodeURIComponent(key)}`,
        MetadataDirective: 'REPLACE',
        ContentType: head.ContentType,
        CacheControl: CACHE_CONTROL,
      }))
      updated++
      if (updated % 50 === 0) console.log(`updated ${updated}...`)
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (continuationToken)

  console.log(`Done: ${updated} updated, ${skipped} already set (prefix "${prefix}")`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
