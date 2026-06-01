import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await prisma.request.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      submittedBy: { select: { name: true, email: true } },
      _count: { select: { items: true } },
      approvals: {
        orderBy: { createdAt: 'asc' },
        include: { approver: { select: { name: true, role: true } } },
      },
    },
  })

  return NextResponse.json({ requests })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, description, items } = body

    if (!title) return NextResponse.json({ error: 'כותרת נדרשת' }, { status: 400 })

    const newRequest = await prisma.request.create({
      data: {
        title,
        description,
        submittedById: session.userId,
        items: {
          create: (items ?? []).map((item: Record<string, unknown>) => ({
            rowLabel: item.rowLabel as string | undefined,
            requiredDate: item.requiredDate as string | undefined,
            requiredQty: item.requiredQty ? Number(item.requiredQty) : undefined,
            std: item.std ? Number(item.std) : undefined,
            mfgPartNumber: item.mfgPartNumber as string | undefined,
            manufacturer: item.manufacturer as string | undefined,
            supplier: item.supplier as string | undefined,
            purchaseQty: item.purchaseQty ? Number(item.purchaseQty) : undefined,
            purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : undefined,
            ppv: item.ppv ? Number(item.ppv) : undefined,
            excess: item.excess ? Number(item.excess) : undefined,
            itemStatus: item.itemStatus as string | undefined,
            parentPart: item.parentPart as string | undefined,
            notes: item.notes as string | undefined,
          })),
        },
      },
      include: {
        items: true,
        submittedBy: { select: { name: true } },
      },
    })

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
