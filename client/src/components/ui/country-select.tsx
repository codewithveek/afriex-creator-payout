'use client'

import { useState, useRef, useEffect } from 'react'
import countries from '@/lib/countries'
import type { Country } from '@/lib/countries'

interface Props {
  value: string
  onChange: (code: string) => void
  required?: boolean
}

export function CountrySelect({ value, onChange, required }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = countries.find((c) => c.code === value)
  const filtered = query
    ? countries.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase()))
    : countries

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(country: Country) {
    onChange(country.code)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="country-search">
        Country
      </label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 0) }}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selected ? (
          <>
            <span className="text-lg leading-none">{selected.flag}</span>
            <span>{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-400">Select a country</span>
        )}
      </button>
      {required && !value && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
          required
          value=""
          onChange={() => {}}
        />
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              ref={inputRef}
              id="country-search"
              type="text"
              placeholder="Search countries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No countries found</li>
            )}
            {filtered.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-blue-50 ${
                    country.code === value ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{country.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
