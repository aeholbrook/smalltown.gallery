import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { allTowns } from '../lib/towns'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || ''
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@smalltown.gallery'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const passwordHash = await hash(password, 12)

  const admin = await prisma.user.create({
    data: {
      email,
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
    },
  })

  console.log(`Created admin user: ${admin.email} (${admin.id})`)
}

async function seedTowns() {
  let created = 0
  for (const town of allTowns) {
    const existing = await prisma.town.findUnique({ where: { name: town.name } })
    if (!existing) {
      await prisma.town.create({
        data: {
          name: town.name,
          latitude: town.lat,
          longitude: town.lng,
          state: 'Illinois',
        },
      })
      created++
    }
  }
  console.log(`Towns: ${created} created, ${allTowns.length - created} already existed`)
}

async function main() {
  await seedAdmin()
  await seedTowns()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
