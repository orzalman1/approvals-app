import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const req = await prisma.request.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { name: true, email: true, role: true } },
      items: true,
      approvals: {
        orderBy: { createdAt: 'asc' },
        include: { approver: { select: { name: true, role: true } } },
      },
    },
  })

  if (!req) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ request: req })
}
