'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'

interface Item {
  rowLabel: string
  requiredDate: string
  requiredQty: string
  std: string
  mfgPartNumber: string
  manufacturer: string
  supplier: string
  purchaseQty: string
  purchasePrice: string
  ppv: string
  excess: string
  itemStatus: string
  parentPart: string
  notes: string
}

const EMPTY_ITEM: Item = {
  rowLabel: '', requiredDate: '', requiredQty: '', std: '',
  mfgPartNumber: '', manufacturer: '', supplier: '',
  purchaseQty: '', purchasePrice: '', ppv: '', excess: '',
  itemStatus: '', parentPart: '', notes: '',
}

interface User {
  name: string
  email: string
  role: string
}

export default function NewRequestPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Load current user
  useState(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
    })
  })

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    setUploading(false)

    if (!res.ok) { setError(data.error); return }
    if (data.items.length === 0) { setError('לא נמצאו שורות בקובץ'); return }

    setItems(data.items.map((item: Partial<Item>) => ({ ...EMPTY_ITEM, ...item })))
    if (!title && file.name) setTitle(file.name.replace(/\.[^/.]+$/, ''))
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM }])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('נא להזין כותרת לבקשה'); return }
    if (items.every(item => !item.rowLabel)) { setError('נא להוסיף לפחות פריט אחד'); return }

    setSubmitting(true)
    setError('')

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, items }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(data.error); return }
    router.push(`/requests/${data.request.id}`)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:underline text-sm mb-2">
            ← חזרה ללוח הבקרה
          </button>
          <h1 className="text-2xl font-bold text-gray-900">בקשה חדשה</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי הבקשה</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת הבקשה *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="לדוגמה: אישור רכש עודפים Q2 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור (אופציונלי)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="הוסף תיאור או הסבר לבקשה..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">פריטים</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
                >
                  {uploading ? 'טוען...' : '📂 ייבוא מ-Excel'}
                </button>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-100"
                >
                  + הוסף שורה
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="text-right py-2 px-2 font-medium">מק"ט</th>
                    <th className="text-right py-2 px-2 font-medium">תאריך נדרש</th>
                    <th className="text-right py-2 px-2 font-medium">כמות נדרשת</th>
                    <th className="text-right py-2 px-2 font-medium">ספק</th>
                    <th className="text-right py-2 px-2 font-medium">כמות רכישה</th>
                    <th className="text-right py-2 px-2 font-medium">מחיר</th>
                    <th className="text-right py-2 px-2 font-medium">Excess</th>
                    <th className="text-right py-2 px-2 font-medium">סטטוס</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-1 px-2">
                        <input
                          value={item.rowLabel}
                          onChange={e => updateItem(i, 'rowLabel', e.target.value)}
                          className="w-28 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="ACT-501..."
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          value={item.requiredDate}
                          onChange={e => updateItem(i, 'requiredDate', e.target.value)}
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="תאריך"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          value={item.requiredQty}
                          onChange={e => updateItem(i, 'requiredQty', e.target.value)}
                          className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          value={item.supplier}
                          onChange={e => updateItem(i, 'supplier', e.target.value)}
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="ספק"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          value={item.purchaseQty}
                          onChange={e => updateItem(i, 'purchaseQty', e.target.value)}
                          className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          value={item.purchasePrice}
                          onChange={e => updateItem(i, 'purchasePrice', e.target.value)}
                          className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          value={item.excess}
                          onChange={e => updateItem(i, 'excess', e.target.value)}
                          className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          value={item.itemStatus}
                          onChange={e => updateItem(i, 'itemStatus', e.target.value)}
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="EXCESS"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs px-1">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium"
            >
              {submitting ? 'שולח...' : 'שליחה לאישור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
