import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const USERS = [
  { name: 'ישראל ישראלי', email: 'user@demo.com', password: 'demo1234', role: 'SUBMITTER' },
  { name: 'רחל כהן', email: 'procurement@demo.com', password: 'demo1234', role: 'PROCUREMENT' },
  { name: 'דוד לוי', email: 'subcontract@demo.com', password: 'demo1234', role: 'SUBCONTRACT_MANAGER' },
  { name: 'שרה מזרחי', email: 'coo@demo.com', password: 'demo1234', role: 'COO' },
]

async function main() {
  console.log('Seeding database...')

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10)
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, name: u.name, role: u.role },
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    })
    console.log(`  ✓ ${u.name} (${u.role})`)
  }

  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
