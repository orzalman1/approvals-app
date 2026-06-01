'use client'

import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/lib/constants'

interface NavbarProps {
  user: { name: string; email: string; role: string }
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">א</span>
        </div>
        <span className="font-bold text-gray-900 text-lg">מערכת אישורים</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{ROLE_LABELS[user.role] ?? user.role}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          התנתק
        </button>
      </div>
    </nav>
  )
}
