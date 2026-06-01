import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 1) return NextResponse.json({ parts: [] })

  const search = `%${q.toUpperCase()}%`
  const parts = await prisma.$queryRaw<{ partName: string; partDes: string | null }[]>`
    SELECT "partName", "partDes"
    FROM "Part"
    WHERE UPPER("partName") LIKE ${search}
       OR UPPER("partDes")  LIKE ${search}
    ORDER BY "partName"
    LIMIT 50
  `

  return NextResponse.json({
    parts: parts.map(p => ({ name: p.partName, des: p.partDes ?? '' })),
  })
}
