'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { List, useListRef } from 'react-window'
import countries from '@/lib/countries'
import type { Country } from '@/lib/countries'

interface Props {
  value: string
  onChange: (code: string) => void
  required?: boolean
}

const ROW_HEIGHT = 42
const LIST_HEIGHT = 240

function CountryRow({
  index,
  style,
  items,
  selected,
  onSelect,
}: {
  ariaAttributes: Record<string, unknown>
  index: number
  style: React.CSSProperties
  items: Country[]
  selected: string
  onSelect: (c: Country) => void
}) {
  const country = items[index]
  if (!country) return null
  return (
    <div style={style}>
      <button
        type="button"
        onClick={() => onSelect(country)}
        className={`flex w-full items-center gap-2 px-3 text-sm transition-colors hover:bg-blue-50 ${
          country.code === selected ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-900'
        }`}
        style={{ height: ROW_HEIGHT }}
      >
        <span className="text-lg leading-none">{country.flag}</span>
        <span>{country.name}</span>
        <span className="ml-auto text-xs text-gray-400">{country.code}</span>
      </button>
    </div>
  )
}

export function CountrySelect({ value, onChange, required }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useListRef(null)

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

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  const handleSelect = useCallback((country: Country) => {
    onChange(country.code)
    setOpen(false)
    setQuery('')
  }, [onChange])

  const rowProps: { items: Country[]; selected: string; onSelect: (c: Country) => void } = { items: filtered, selected: value, onSelect: handleSelect }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="country-search">
        Country
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
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
              ref={searchRef}
              id="country-search"
              type="text"
              placeholder="Search countries..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                listRef.current?.scrollToRow({ index: 0 })
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-gray-500">No countries found</div>
          ) : (
            <List
              listRef={listRef}
              rowComponent={CountryRow}
              rowCount={filtered.length}
              rowHeight={ROW_HEIGHT}
              rowProps={rowProps as any}
              style={{ height: Math.min(LIST_HEIGHT, filtered.length * ROW_HEIGHT) }}
            />
          )}
        </div>
      )}
    </div>
  )
}
