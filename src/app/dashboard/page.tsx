'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { StatusBadge } from '@/components/StatusBadge'
import { STAGE_FOR_ROLE, STATUS_LABELS } from '@/lib/constants'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Request {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  submittedBy: { name: string; email: string }
  _count: { items: number }
  approvals: Array<{ stage: string; action: string; approver: { name: string } }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
    })

    fetch('/api/requests').then(r => r.json()).then(data => {
      setRequests(data.requests ?? [])
      setLoading(false)
    })
  }, [router])

  if (!user) return null

  const pendingMyApproval = requests.filter(r => {
    if (user.role === 'SUBMITTER') return false
    return r.status === STAGE_FOR_ROLE[user.role]
  })

  const filtered = filter === 'ALL'
    ? requests
    : filter === 'MINE'
    ? requests.filter(r => r.submittedBy.email === user.email)
    : requests.filter(r => r.status === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">לוח הבקרה</h1>
            <p className="text-gray-500 mt-1">ניהול ומעקב אחר בקשות אישור</p>
          </div>
          <button
            onClick={() => router.push('/requests/new')}
            className="bg-blue-600 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            + בקשה חדשה
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'סה"כ בקשות', value: requests.length, color: 'bg-white' },
            { label: 'ממתינות לאישורי', value: pendingMyApproval.length, color: user.role !== 'SUBMITTER' ? 'bg-orange-50 border-orange-200' : 'bg-white' },
            { label: 'אושרו', value: requests.filter(r => r.status === 'APPROVED').length, color: 'bg-green-50 border-green-200' },
            { label: 'נדחו', value: requests.filter(r => r.status === 'REJECTED').length, color: 'bg-red-50 border-red-200' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl border p-4 ${stat.color} border-gray-200`}>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pending My Approval Section */}
        {pendingMyApproval.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-orange-900 mb-3">
              ⏳ ממתינות לאישורך ({pendingMyApproval.length})
            </h2>
            <div className="space-y-2">
              {pendingMyApproval.map(req => (
                <button
                  key={req.id}
                  onClick={() => router.push(`/requests/${req.id}`)}
                  className="w-full flex items-center justify-between bg-white border border-orange-200 rounded-lg px-4 py-3 hover:bg-orange-50 transition-colors text-right"
                >
                  <div>
                    <p className="font-medium text-gray-900">{req.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.submittedBy.name} • {req._count.items} פריטים •{' '}
                      {new Date(req.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <span className="text-orange-600 font-medium text-sm">לאישור ←</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 me-2">כל הבקשות</span>
            {['ALL', 'MINE', 'PENDING_PROCUREMENT', 'PENDING_SUBCONTRACT', 'PENDING_COO', 'APPROVED', 'REJECTED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f === 'ALL' ? 'הכל' : f === 'MINE' ? 'שלי' : STATUS_LABELS[f] ?? f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>אין בקשות להצגה</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="text-right py-3 px-6 font-medium">כותרת</th>
                    <th className="text-right py-3 px-4 font-medium">מגיש</th>
                    <th className="text-right py-3 px-4 font-medium">פריטים</th>
                    <th className="text-right py-3 px-4 font-medium">סטטוס</th>
                    <th className="text-right py-3 px-4 font-medium">תאריך</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(req => (
                    <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6">
                        <p className="font-medium text-gray-900">{req.title}</p>
                        {req.description && <p className="text-xs text-gray-500 mt-0.5">{req.description}</p>}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{req.submittedBy.name}</td>
                      <td className="py-3 px-4 text-gray-700">{req._count.items}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {new Date(req.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => router.push(`/requests/${req.id}`)}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          פתח
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
