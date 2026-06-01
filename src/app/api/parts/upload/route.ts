import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import * as XLSX from 'xlsx'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.userId || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'קובץ לא נמצא' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (rows.length === 0) {
    return NextResponse.json({ error: 'הקובץ ריק' }, { status: 400 })
  }

  // Auto-detect column names (case-insensitive)
  const firstRow = rows[0]
  const keys = Object.keys(firstRow)

  function findCol(options: string[]) {
    return keys.find(k => options.some(o => k.toUpperCase().includes(o.toUpperCase()))) ?? null
  }

  const nameCol = findCol(['PARTNAME', 'מקט', 'מק"ט', 'PART'])
  const desCol  = findCol(['PARTDES', 'תיאור', 'DES', 'DESCRIPTION'])
  const stdCol  = findCol(['STD', 'מחיר', 'PRICE'])

  if (!nameCol) {
    return NextResponse.json({
      error: `לא נמצאה עמודת מק"ט. עמודות שנמצאו: ${keys.join(', ')}`
    }, { status: 400 })
  }

  const parts = rows
    .map(row => ({
      partName: String(row[nameCol!] ?? '').trim(),
      partDes:  desCol  ? String(row[desCol]  ?? '').trim() || null : null,
      std:      stdCol  ? parseFloat(String(row[stdCol] ?? '')) || null : null,
    }))
    .filter(p => p.partName)

  if (parts.length === 0) {
    return NextResponse.json({ error: 'לא נמצאו שורות עם מק"ט' }, { status: 400 })
  }

  const names = parts.map(p => p.partName)
  const descs = parts.map(p => p.partDes ?? '')
  const stds  = parts.map(p => p.std ?? 0)

  // Single-query bulk upsert via unnest arrays (fastest PostgreSQL bulk method)
  await prisma.$executeRaw`TRUNCATE TABLE "Part" RESTART IDENTITY`
  await prisma.$executeRaw`
    INSERT INTO "Part" ("partName", "partDes", "std")
    SELECT u.name, NULLIF(u.des, ''), NULLIF(u.std, 0)
    FROM unnest(
      ${names}::text[],
      ${descs}::text[],
      ${stds}::float8[]
    ) AS u(name, des, std)
  `

  return NextResponse.json({ imported: parts.length })
}
