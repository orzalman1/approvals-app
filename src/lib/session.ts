import { SessionOptions, getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId: string
  name: string
  email: string
  role: string
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'approvals-app-secret-key-change-in-prod-32chars',
  cookieName: 'approvals-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  return session
}
