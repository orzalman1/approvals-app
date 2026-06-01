import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

const PRIORITY_BASE = 'https://actelis.edpcloud.co.il/odata/Priority/tabula.ini/actil'
const AUTH = 'Basic ' + Buffer.from('API:API').toString('base64')

export async function POST() {
  const session = await getSession()
  if (!session.userId || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let allParts: { PARTNAME: string; PARTDES: string }[] = []
  let skip = 0
  const top = 1000

  // Paginate through all parts
  while (true) {
    const url = `${PRIORITY_BASE}/PART?$select=PARTNAME,PARTDES&$top=${top}&$skip=${skip}&$orderby=PARTNAME`
    const res = await fetch(url, {
      headers: { Authorization: AUTH, Accept: 'application/json' },
    })

    if (!res.ok) {
      console.error('[sync] Priority error:', res.status, await res.text())
      return NextResponse.json({ error: `Priority API error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const batch: { PARTNAME: string; PARTDES: string }[] = data.value ?? []
    allParts = allParts.concat(batch)

    if (batch.length < top) break
    skip += top
  }

  if (allParts.length === 0) {
    return NextResponse.json({ error: 'לא נמצאו מק"טים ב-Priority' }, { status: 404 })
  }

  // Upsert all parts in batches of 500
  let upserted = 0
  const batchSize = 500
  for (let i = 0; i < allParts.length; i += batchSize) {
    const batch = allParts.slice(i, i + batchSize)
    await Promise.all(
      batch.map(p =>
        prisma.part.upsert({
          where: { partName: p.PARTNAME },
          update: { partDes: p.PARTDES || null, syncedAt: new Date() },
          create: { partName: p.PARTNAME, partDes: p.PARTDES || null },
        })
      )
    )
    upserted += batch.length
  }

  return NextResponse.json({ synced: upserted })
}
