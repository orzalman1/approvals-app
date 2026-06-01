'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { StatusBadge } from '@/components/StatusBadge'
import { ROLE_LABELS, STAGE_FOR_ROLE } from '@/lib/constants'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface RequestItem {
  id: string
  rowLabel: string | null
  requiredDate: string | null
  requiredQty: number | null
  std: number | null
  mfgPartNumber: string | null
  manufacturer: string | null
  supplier: string | null
  purchaseQty: number | null
  purchasePrice: number | null
  ppv: number | null
  excess: number | null
  itemStatus: string | null
  parentPart: string | null
  notes: string | null
}

interface Approval {
  id: string
  stage: string
  action: string
  comment: string | null
  createdAt: string
  approver: { name: string; role: string }
}

interface RequestDetail {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  submittedBy: { name: string; email: string; role: string }
  items: RequestItem[]
  approvals: Approval[]
}

const STAGE_LABELS: Record<string, string> = {
  PROCUREMENT: 'רכש',
  SUBCONTRACT_MANAGER: 'מנהל קבלני משנה',
  COO: 'סמנכ"ל תפעול',
}

export default function RequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
    })

    fetch(`/api/requests/${id}`).then(r => r.json()).then(data => {
      setRequest(data.request)
      setLoading(false)
    })
  }, [id, router])

  async function handleApproval(e: React.FormEvent) {
    e.preventDefault()
    if (!action) return
    setSubmitting(true)
    setError('')

    const res = await fetch(`/api/requests/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(data.error); return }

    // Refresh request data
    fetch(`/api/requests/${id}`).then(r => r.json()).then(d => setRequest(d.request))
    setAction(null)
    setComment('')
  }

  if (!user || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">טוען...</div>
  if (!request) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">בקשה לא נמצאה</div>

  const isActive = !['APPROVED', 'REJECTED'].includes(request.status)
  const canApprove =
    isActive &&
    (user.role === 'ADMIN' ||
      (user.role !== 'SUBMITTER' && request.status === STAGE_FOR_ROLE[user.role]))

  const WORKFLOW_STAGES = [
    { key: 'PENDING_PROCUREMENT', label: 'אישור רכש', stageKey: 'PROCUREMENT' },
    { key: 'PENDING_SUBCONTRACT', label: 'אישור מנהל קבלני משנה', stageKey: 'SUBCONTRACT_MANAGER' },
    { key: 'PENDING_COO', label: 'אישור סמנכ"ל תפעול', stageKey: 'COO' },
    { key: 'APPROVED', label: 'אושר', stageKey: null },
  ]

  const STATUS_ORDER = ['PENDING_PROCUREMENT', 'PENDING_SUBCONTRACT', 'PENDING_COO', 'APPROVED']
  const currentIdx = STATUS_ORDER.indexOf(request.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:underline text-sm mb-6 block">
          ← חזרה ללוח הבקרה
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{request.title}</h1>
                  {request.description && <p className="text-gray-600 mt-1">{request.description}</p>}
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                <span>מגיש: <span className="text-gray-700 font-medium">{request.submittedBy.name}</span></span>
                <span>תאריך: <span className="text-gray-700">{new Date(request.createdAt).toLocaleDateString('he-IL')}</span></span>
                <span>פריטים: <span className="text-gray-700 font-medium">{request.items.length}</span></span>
              </div>
            </div>

            {/* Items table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">פריטים ({request.items.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600 text-xs">
                      <th className="text-right py-2 px-3 font-medium">מק"ט</th>
                      <th className="text-right py-2 px-3 font-medium">תאריך נדרש</th>
                      <th className="text-right py-2 px-3 font-medium">כמות נדרשת</th>
                      <th className="text-right py-2 px-3 font-medium">ספק</th>
                      <th className="text-right py-2 px-3 font-medium">כמות רכישה</th>
                      <th className="text-right py-2 px-3 font-medium">מחיר</th>
                      <th className="text-right py-2 px-3 font-medium">Excess</th>
                      <th className="text-right py-2 px-3 font-medium">סטטוס פריט</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.items.map(item => (
                      <tr key={item.id} className={`border-b border-gray-100 text-xs ${item.itemStatus?.includes('EXCESS') ? 'bg-green-50' : ''}`}>
                        <td className="py-2 px-3 font-mono text-gray-800">{item.rowLabel ?? '—'}</td>
                        <td className="py-2 px-3 text-gray-600">{item.requiredDate ?? '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{item.requiredQty ?? '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{item.supplier ?? '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{item.purchaseQty ?? '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{item.purchasePrice ?? '—'}</td>
                        <td className="py-2 px-3 text-gray-700">{item.excess ?? '—'}</td>
                        <td className="py-2 px-3">
                          {item.itemStatus && (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              item.itemStatus === 'EXCESS' ? 'bg-green-100 text-green-800' :
                              item.itemStatus === 'V+EXCESS' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.itemStatus}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval action form */}
            {canApprove && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">פעולת אישור</h2>
                <form onSubmit={handleApproval} className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setAction('APPROVED')}
                      className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                        action === 'APPROVED'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-green-300 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      ✓ אשר
                    </button>
                    <button
                      type="button"
                      onClick={() => setAction('REJECTED')}
                      className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                        action === 'REJECTED'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-red-300 text-red-700 hover:bg-red-50'
                      }`}
                    >
                      ✕ דחה
                    </button>
                  </div>

                  {action && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          הערה {action === 'REJECTED' ? '(חובה לדחייה)' : '(אופציונלי)'}
                        </label>
                        <textarea
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          required={action === 'REJECTED'}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="הוסף הערה..."
                        />
                      </div>
                      {error && <p className="text-red-600 text-sm">{error}</p>}
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full py-2.5 rounded-lg font-medium text-white disabled:opacity-60 transition-colors ${
                          action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {submitting ? 'שומר...' : action === 'APPROVED' ? 'אשר בקשה' : 'דחה בקשה'}
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Workflow progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-5">מסלול אישורים</h2>
              <div className="space-y-4">
                {WORKFLOW_STAGES.map((stage, idx) => {
                  const approval = request.approvals.find(a => a.stage === stage.stageKey)
                  const isRejected = request.status === 'REJECTED' && approval?.action === 'REJECTED'
                  const isDone = approval?.action === 'APPROVED' || (stage.key === 'APPROVED' && request.status === 'APPROVED')
                  const isCurrent = request.status === stage.key && stage.key !== 'APPROVED'
                  const isPending = !isDone && !isCurrent && !isRejected

                  return (
                    <div key={stage.key} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        isRejected ? 'bg-red-100 text-red-600' :
                        isDone ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-orange-400 text-white' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isRejected ? '✕' : isDone ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                          {stage.label}
                        </p>
                        {approval && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {approval.approver.name} •{' '}
                            {new Date(approval.createdAt).toLocaleDateString('he-IL')}
                          </p>
                        )}
                        {approval?.comment && (
                          <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">
                            {approval.comment}
                          </p>
                        )}
                        {isCurrent && <p className="text-xs text-orange-600 mt-0.5">ממתין לאישור</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-sm space-y-3">
              <h3 className="font-semibold text-gray-900">פרטים</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>מגיש:</span>
                  <span className="text-gray-900 font-medium">{request.submittedBy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>תפקיד מגיש:</span>
                  <span className="text-gray-900">{ROLE_LABELS[request.submittedBy.role] ?? request.submittedBy.role}</span>
                </div>
                <div className="flex justify-between">
                  <span>נוצר:</span>
                  <span className="text-gray-900">{new Date(request.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
                <div className="flex justify-between">
                  <span>אישורים:</span>
                  <span className="text-gray-900">{request.approvals.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
