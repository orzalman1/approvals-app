'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { PartSearch } from '@/components/PartSearch'

interface Item {
  rowLabel: string
  partDes: string
  requiredDate: string
  requiredQty: string
  std: string
  supplier: string
  purchaseQty: string
  purchasePrice: string
  itemStatus: string
  notes: string
}

const EMPTY_ITEM: Item = {
  rowLabel: '', partDes: '', requiredDate: '', requiredQty: '',
  std: '', supplier: '', purchaseQty: '', purchasePrice: '',
  itemStatus: '', notes: '',
}

function calcPPV(std: string, price: string, purchaseQty: string): string {
  const s = parseFloat(std), p = parseFloat(price), q = parseFloat(purchaseQty)
  if (isNaN(s) || isNaN(p) || isNaN(q)) return ''
  return ((p - s) * q).toFixed(2)
}

function calcExcess(purchaseQty: string, requiredQty: string, std: string): string {
  const pq = parseFloat(purchaseQty), rq = parseFloat(requiredQty), s = parseFloat(std)
  if (isNaN(pq) || isNaN(rq) || isNaN(s)) return ''
  return ((pq - rq) * s).toFixed(2)
}

interface User { name: string; email: string; role: string }

export default function NewRequestPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
    })
  }, [router])

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
    if (!data.items.length) { setError('לא נמצאו שורות בקובץ'); return }
    setItems(data.items.map((item: Partial<Item>) => ({ ...EMPTY_ITEM, ...item })))
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() { setItems(prev => [...prev, { ...EMPTY_ITEM }]) }
  function removeItem(index: number) { setItems(prev => prev.filter((_, i) => i !== index)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('נא להזין כותרת לבקשה'); return }
    if (items.every(item => !item.rowLabel)) { setError('נא להוסיף לפחות פריט אחד'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        items: items.filter(i => i.rowLabel).map(i => ({
          rowLabel: i.rowLabel,
          notes: i.partDes || i.notes,
          requiredDate: i.requiredDate,
          requiredQty: i.requiredQty,
          std: i.std,
          supplier: i.supplier,
          purchaseQty: i.purchaseQty,
          purchasePrice: i.purchasePrice,
          ppv: calcPPV(i.std, i.purchasePrice, i.purchaseQty),
          excess: calcExcess(i.purchaseQty, i.requiredQty, i.std),
          itemStatus: i.itemStatus,
        })),
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error); return }
    router.push(`/requests/${data.request.id}`)
  }

  if (!user) return null

  const inputCls = 'w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400'
  const calcCls = 'w-full bg-gray-50 border border-gray-100 rounded px-2 py-1 text-xs text-gray-700 font-mono text-center'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:underline text-sm mb-2">
            ← חזרה ללוח הבקרה
          </button>
          <h1 className="text-2xl font-bold text-gray-900">בקשה חדשה</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת הבקשה *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="לדוגמה: אישור עודפים Q2 2026" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">פריטים</h2>
              <div className="flex gap-3">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-60">
                  {uploading ? 'טוען...' : '📂 ייבוא מ-Excel'}
                </button>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
                <button type="button" onClick={addItem}
                  className="text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-100">
                  + הוסף שורה
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 text-xs">
                    <th className="text-right py-2 px-2 font-medium w-40">מק"ט</th>
                    <th className="text-right py-2 px-2 font-medium w-56">תיאור</th>
                    <th className="text-right py-2 px-2 font-medium w-32">תאריך נדרש</th>
                    <th className="text-right py-2 px-2 font-medium">כמות נדרשת</th>
                    <th className="text-right py-2 px-2 font-medium">STD</th>
                    <th className="text-right py-2 px-2 font-medium">ספק</th>
                    <th className="text-right py-2 px-2 font-medium">כמות רכישה</th>
                    <th className="text-right py-2 px-2 font-medium">מחיר</th>
                    <th className="text-center py-2 px-2 font-medium text-blue-600">PPV</th>
                    <th className="text-center py-2 px-2 font-medium text-blue-600">EXCESS</th>
                    <th className="text-right py-2 px-2 font-medium">סטטוס</th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const ppv = calcPPV(item.std, item.purchasePrice, item.purchaseQty)
                    const excess = calcExcess(item.purchaseQty, item.requiredQty, item.std)
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-1 px-2 w-44">
                          <PartSearch value={item.rowLabel}
                            onChange={(name, des, std) => setItems(prev => prev.map((it, idx) =>
                              idx === i ? { ...it, rowLabel: name, partDes: des, std: std != null ? String(std) : it.std } : it))} />
                        </td>
                        <td className="py-1 px-2 w-56">
                          <input value={item.partDes} onChange={e => updateItem(i, 'partDes', e.target.value)}
                            className={inputCls} placeholder="תיאור" title={item.partDes} />
                        </td>
                        <td className="py-1 px-2 w-32">
                          <input type="date" value={item.requiredDate} onChange={e => updateItem(i, 'requiredDate', e.target.value)}
                            className={inputCls} />
                        </td>
                        <td className="py-1 px-2 w-20">
                          <input type="number" value={item.requiredQty} onChange={e => updateItem(i, 'requiredQty', e.target.value)}
                            className={inputCls} placeholder="0" />
                        </td>
                        <td className="py-1 px-2 w-20">
                          <input type="number" value={item.std} onChange={e => updateItem(i, 'std', e.target.value)}
                            className={inputCls} placeholder="0.00" />
                        </td>
                        <td className="py-1 px-2 w-24">
                          <input value={item.supplier} onChange={e => updateItem(i, 'supplier', e.target.value)}
                            className={inputCls} placeholder="ספק" />
                        </td>
                        <td className="py-1 px-2 w-20">
                          <input type="number" value={item.purchaseQty} onChange={e => updateItem(i, 'purchaseQty', e.target.value)}
                            className={inputCls} placeholder="0" />
                        </td>
                        <td className="py-1 px-2 w-20">
                          <input type="number" value={item.purchasePrice} onChange={e => updateItem(i, 'purchasePrice', e.target.value)}
                            className={inputCls} placeholder="0.00" />
                        </td>
                        <td className="py-1 px-2 w-20">
                          <div className={`${calcCls} ${ppv && parseFloat(ppv) < 0 ? 'text-red-600' : 'text-green-700'}`}>
                            {ppv || '—'}
                          </div>
                        </td>
                        <td className="py-1 px-2 w-20">
                          <div className={`${calcCls} ${excess && parseFloat(excess) > 0 ? 'text-orange-600' : ''}`}>
                            {excess || '—'}
                          </div>
                        </td>
                        <td className="py-1 px-2 w-24">
                          <input value={item.itemStatus} onChange={e => updateItem(i, 'itemStatus', e.target.value)}
                            className={inputCls} placeholder="EXCESS" />
                        </td>
                        <td className="py-1 px-2">
                          <button type="button" onClick={() => removeItem(i)}
                            className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              ביטול
            </button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium">
              {submitting ? 'שולח...' : 'שליחה לאישור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
