'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { List, useListRef } from 'react-window'
import { data } from '@/lib/countries'
import type { Country } from '@/lib/countries'

const countries: Country[] = data.map((item) => ({
  code: item.cca2,
  name: item.name.common,
  flag: item.flags.png,
}))

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
  index: number
  style: React.CSSProperties
  items: Country[]
  selected: string
  onSelect: (c: Country) => void
}) {
  const country = items[index]
  if (!country) return null
  const isSelected = country.code === selected
  return (
    <div style={style} role="option" aria-selected={isSelected}>
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => onSelect(country)}
        className={`flex w-full items-center gap-2 px-3 text-sm transition-colors hover:bg-accent-muted ${
          isSelected ? 'bg-accent-muted font-medium text-accent' : 'text-fg'
        }`}
        style={{ height: ROW_HEIGHT }}
      >
        <span className="text-lg leading-none">{country.flag}</span>
        <span>{country.name}</span>
        <span className="ml-auto text-xs text-fg-subtle">{country.code}</span>
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
  const listboxId = 'country-listbox'

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
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [open])

  const handleSelect = useCallback((country: Country) => {
    onChange(country.code)
    setOpen(false)
    setQuery('')
  }, [onChange])

  const rowProps = { items: filtered, selected: value, onSelect: handleSelect }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-fg-muted mb-1" htmlFor="country-search">
        Country
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {selected ? (
          <>
            <span className="text-lg leading-none">{selected.flag}</span>
            <span>{selected.name}</span>
          </>
        ) : (
          <span className="text-fg-subtle">Select a country</span>
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
        <div
          id={listboxId}
          role="listbox"
          aria-label="Select a country"
          className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg shadow-lg"
        >
          <div className="border-b border-border-light p-2">
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
              className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-fg-subtle">No countries found</div>
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
