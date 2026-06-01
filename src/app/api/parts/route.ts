import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 1) return NextResponse.json({ parts: [] })

  const parts = await prisma.part.findMany({
    where: {
      OR: [
        { partName: { contains: q, mode: 'insensitive' } },
        { partDes: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { partName: 'asc' },
    take: 50,
    select: { partName: true, partDes: true },
  })

  return NextResponse.json({
    parts: parts.map(p => ({ name: p.partName, des: p.partDes ?? '' })),
  })
}
