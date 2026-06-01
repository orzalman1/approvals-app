import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export const maxDuration = 60

const PRIORITY_BASE = 'https://actelis.edpcloud.co.il/odata/Priority/tabula.ini/actil'
const AUTH = 'Basic ' + Buffer.from('API:API').toString('base64')

export async function POST() {
  const session = await getSession()
  if (!session.userId || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Fetch all parts from Priority (try large batch first)
  const allParts: { PARTNAME: string; PARTDES: string }[] = []
  let skip = 0
  const top = 5000

  while (true) {
    const url = `${PRIORITY_BASE}/PART?$select=PARTNAME,PARTDES&$top=${top}&$skip=${skip}`
    const res = await fetch(url, {
      headers: { Authorization: AUTH, Accept: 'application/json' },
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Priority error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const batch: { PARTNAME: string; PARTDES: string }[] = data.value ?? []
    allParts.push(...batch)

    if (batch.length < top) break
    skip += top
  }

  if (allParts.length === 0) {
    return NextResponse.json({ error: 'לא נמצאו מק"טים' }, { status: 404 })
  }

  // Bulk replace: truncate + createMany (much faster than upsert loop)
  await prisma.$executeRaw`TRUNCATE TABLE "Part" RESTART IDENTITY`
  await prisma.part.createMany({
    data: allParts.map(p => ({
      partName: p.PARTNAME,
      partDes: p.PARTDES || null,
    })),
  })

  return NextResponse.json({ synced: allParts.length })
}
