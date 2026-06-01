import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'קובץ לא נמצא' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (rows.length < 2) return NextResponse.json({ items: [] })

    // Skip header row (row 0)
    const items = rows.slice(1).map((row: unknown[]) => {
      const r = row as (string | number | Date | null)[]
      const requiredDate = r[1]
      let dateStr: string | undefined
      if (requiredDate instanceof Date) {
        dateStr = requiredDate.toLocaleDateString('he-IL')
      } else if (requiredDate) {
        dateStr = String(requiredDate)
      }

      return {
        rowLabel: r[0] ? String(r[0]) : undefined,
        requiredDate: dateStr,
        requiredQty: r[2] ? Number(r[2]) : undefined,
        std: r[3] ? Number(r[3]) : undefined,
        mfgPartNumber: r[4] ? String(r[4]) : undefined,
        manufacturer: r[5] ? String(r[5]) : undefined,
        supplier: r[6] ? String(r[6]) : undefined,
        purchaseQty: r[7] ? Number(r[7]) : undefined,
        purchasePrice: r[8] ? Number(r[8]) : undefined,
        ppv: r[9] ? Number(r[9]) : undefined,
        excess: r[10] ? Number(r[10]) : undefined,
        itemStatus: r[11] ? String(r[11]) : undefined,
        parentPart: r[12] ? String(r[12]) : undefined,
      }
    }).filter(item => item.rowLabel)

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'שגיאה בקריאת הקובץ' }, { status: 500 })
  }
}
