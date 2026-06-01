import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'נא למלא אימייל וסיסמה' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'פרטים שגויים' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'פרטים שגויים' }, { status: 401 })
    }

    const session = await getSession()
    session.userId = user.id
    session.name = user.name
    session.email = user.email
    session.role = user.role
    await session.save()

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error('[login] error:', err)
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
