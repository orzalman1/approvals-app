'use client'

import { useState, useEffect, useRef } from 'react'

interface Part {
  name: string
  des: string
}

interface PartSearchProps {
  value: string
  onChange: (name: string, des: string) => void
  placeholder?: string
}

export function PartSearch({ value, onChange, placeholder = 'חפש מק"ט...' }: PartSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Part[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 1) { setResults([]); return }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/parts?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.parts ?? [])
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(part: Part) {
    setQuery(part.name)
    setOpen(false)
    onChange(part.name, part.des)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); if (!e.target.value) onChange('', '') }}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder={placeholder}
        dir="ltr"
        autoComplete="off"
      />
      {loading && (
        <span className="absolute left-2 top-1 text-xs text-gray-400">...</span>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 bottom-full mb-1 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map(part => (
            <button
              key={part.name}
              type="button"
              onMouseDown={() => select(part)}
              className="w-full text-right px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
            >
              <p className="text-xs font-mono font-medium text-gray-900">{part.name}</p>
              {part.des && <p className="text-xs text-gray-500 truncate">{part.des}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
