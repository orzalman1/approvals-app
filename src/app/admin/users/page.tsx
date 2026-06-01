'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ROLE_LABELS } from '@/lib/constants'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface CurrentUser {
  id: string
  name: string
  email: string
  role: string
}

const ROLES = ['SUBMITTER', 'PROCUREMENT', 'SUBCONTRACT_MANAGER', 'COO', 'ADMIN']

export default function UsersAdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SUBMITTER' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user || data.user.role !== 'ADMIN') { router.push('/dashboard'); return }
      setCurrentUser(data.user)
    })
    loadUsers()
  }, [router])

  async function loadUsers() {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditUser(null)
    setForm({ name: '', email: '', password: '', role: 'SUBMITTER' })
    setError('')
    setShowForm(true)
  }

  function openEdit(u: User) {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setError('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    let res: Response
    if (editUser) {
      res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, role: form.role, password: form.password || undefined }),
      })
    } else {
      res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }

    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }

    setShowForm(false)
    loadUsers()
  }

  async function handleDelete(u: User) {
    if (!confirm(`למחוק את ${u.name}?`)) return
    await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
    loadUsers()
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:underline text-sm mb-1 block">
              ← חזרה ללוח הבקרה
            </button>
            <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
          </div>
          <button
            onClick={openNew}
            className="bg-blue-600 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-blue-700 transition-colors"
          >
            + משתמש חדש
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                {editUser ? 'עריכת משתמש' : 'משתמש חדש'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ישראל ישראלי"
                  />
                </div>
                {!editUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                      dir="ltr"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@company.com"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סיסמה {editUser && <span className="text-gray-400 font-normal">(השאר ריק כדי לא לשנות)</span>}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required={!editUser}
                    dir="ltr"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-gray-300 rounded-lg py-2.5 text-gray-700 hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 hover:bg-blue-700 disabled:opacity-60 font-medium"
                  >
                    {saving ? 'שומר...' : 'שמור'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="text-center py-12 text-gray-400">טוען...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="text-right py-3 px-6 font-medium">שם</th>
                  <th className="text-right py-3 px-4 font-medium">אימייל</th>
                  <th className="text-right py-3 px-4 font-medium">תפקיד</th>
                  <th className="text-right py-3 px-4 font-medium">נוצר</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium text-gray-900">{u.name}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs" dir="ltr">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'COO' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'SUBCONTRACT_MANAGER' ? 'bg-indigo-100 text-indigo-800' :
                        u.role === 'PROCUREMENT' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs">
                          ערוך
                        </button>
                        {u.id !== currentUser.id && (
                          <button onClick={() => handleDelete(u)} className="text-red-500 hover:underline text-xs">
                            מחק
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
