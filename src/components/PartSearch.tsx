'use client'

import { useState, useEffect, useRef } from 'react'

interface Part { name: string; des: string; std: number | null }

interface PartSearchProps {
  value: string
  onChange: (name: string, des: string, std: number | null) => void
  placeholder?: string
}

export function PartSearch({ value, onChange, placeholder = 'חפש מק"ט...' }: PartSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Part[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 1) { setResults([]); setOpen(false); return }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/parts?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        const parts = data.parts ?? []
        setResults(parts)
        if (parts.length > 0 && inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect()
          setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 280),
            zIndex: 9999,
          })
          setOpen(true)
        }
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current?.contains(e.target as Node)) return
      if (inputRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(part: Part) {
    setQuery(part.name)
    setOpen(false)
    onChange(part.name, part.des, part.std)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab' && open && results.length > 0) {
      e.preventDefault()
      select(results[0])
      // Move focus to next input after selection
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLElement>('input, select, textarea, button[tabindex]')
        const idx = Array.from(inputs).indexOf(inputRef.current!)
        if (idx >= 0 && inputs[idx + 1]) inputs[idx + 1].focus()
      }, 0)
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) onChange('', '', null) }}
          onKeyDown={handleKeyDown}
          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder={placeholder}
          dir="ltr"
          autoComplete="off"
        />
        {loading && <span className="absolute left-2 top-1 text-xs text-gray-400">...</span>}
      </div>

      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {results.map(part => (
            <button
              key={part.name}
              type="button"
              onClick={() => select(part)}
              className="w-full text-right px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
            >
              <p className="text-xs font-mono font-medium text-gray-900">{part.name}</p>
              {part.des && <p className="text-xs text-gray-500 truncate">{part.des}</p>}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
