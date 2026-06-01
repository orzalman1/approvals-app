import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { STAGE_FOR_ROLE } from '@/lib/constants'

const NEXT_STATUS: Record<string, string> = {
  PENDING_PROCUREMENT: 'PENDING_SUBCONTRACT',
  PENDING_SUBCONTRACT: 'PENDING_COO',
  PENDING_COO: 'APPROVED',
}

const STAGE_NAME: Record<string, string> = {
  PENDING_PROCUREMENT: 'PROCUREMENT',
  PENDING_SUBCONTRACT: 'SUBCONTRACT_MANAGER',
  PENDING_COO: 'COO',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.role
  if (role === 'SUBMITTER') {
    return NextResponse.json({ error: 'אין הרשאה לאשר' }, { status: 403 })
  }

  const { id } = await params
  const { action, comment } = await request.json()

  if (action !== 'APPROVED' && action !== 'REJECTED') {
    return NextResponse.json({ error: 'פעולה לא חוקית' }, { status: 400 })
  }

  const req = await prisma.request.findUnique({ where: { id } })
  if (!req) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  // ADMIN can approve at any stage; others only at their stage
  if (role !== 'ADMIN') {
    const expectedStatus = STAGE_FOR_ROLE[role]
    if (req.status !== expectedStatus) {
      return NextResponse.json({ error: 'הבקשה אינה בשלב שלך לאישור' }, { status: 400 })
    }
  }

  if (['APPROVED', 'REJECTED'].includes(req.status)) {
    return NextResponse.json({ error: 'הבקשה כבר טופלה' }, { status: 400 })
  }

  const newStatus = action === 'REJECTED' ? 'REJECTED' : NEXT_STATUS[req.status]

  const [updatedRequest] = await prisma.$transaction([
    prisma.request.update({
      where: { id },
      data: { status: newStatus },
    }),
    prisma.approval.create({
      data: {
        requestId: id,
        approverId: session.userId,
        stage: STAGE_NAME[req.status],
        action,
        comment,
      },
    }),
  ])

  return NextResponse.json({ request: updatedRequest })
}
