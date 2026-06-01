import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const PRIORITY_BASE = 'https://actelis.edpcloud.co.il/odata/Priority/tabula.ini/actil'
const AUTH = 'Basic ' + Buffer.from('API:API').toString('base64')

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 1) return NextResponse.json({ parts: [] })

  // OData v2 uses substringof() instead of contains()
  const filter = `substringof('${q}',PARTNAME) or substringof('${q}',PARTDES)`
  const url = `${PRIORITY_BASE}/PART?$select=PARTNAME,PARTDES&$filter=${encodeURIComponent(filter)}&$top=50&$orderby=PARTNAME`

  try {
    const res = await fetch(url, {
      headers: { Authorization: AUTH, Accept: 'application/json' },
    })
    if (!res.ok) return NextResponse.json({ error: 'Priority API error' }, { status: res.status })

    const data = await res.json()
    const parts = (data.value ?? []).map((p: { PARTNAME: string; PARTDES: string }) => ({
      name: p.PARTNAME,
      des: p.PARTDES,
    }))
    return NextResponse.json({ parts })
  } catch (err) {
    console.error('[parts]', err)
    return NextResponse.json({ error: 'שגיאה בטעינת מק"טים' }, { status: 500 })
  }
}
