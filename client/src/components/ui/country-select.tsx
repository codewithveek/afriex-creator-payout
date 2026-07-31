'use client'

import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { countries } from '@/lib/countries'
import type { Country } from '@/lib/countries'

interface Props {
  value: string
  onChange: (code: string) => void
  required?: boolean
}

export function CountrySelect({ value, onChange, required }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const selected = countries.find((c) => c.code === value)
  const filtered = query
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.code.toLowerCase().includes(query.toLowerCase()),
      )
    : countries

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
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

  useEffect(() => {
    if (!open || activeIndex < 0) return
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const close = useCallback((refocus: boolean) => {
    setOpen(false)
    setQuery('')
    if (refocus) triggerRef.current?.focus()
  }, [])

  const openDropdown = useCallback(() => {
    const selectedIndex = countries.findIndex((c) => c.code === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }, [value])

  const handleSelect = useCallback(
    (country: Country) => {
      onChange(country.code)
      close(true)
    },
    [onChange, close],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(filtered.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && filtered[activeIndex]) handleSelect(filtered[activeIndex])
        break
      case 'Escape':
        e.preventDefault()
        close(true)
        break
      case 'Tab':
        close(false)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <span id={`${baseId}-label`} className="mb-1 block text-sm font-medium text-fg-muted">
        Country
      </span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(false) : openDropdown())}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${baseId}-label`}
        className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {selected ? (
          <>
            <span className="text-lg leading-none" aria-hidden>
              {selected.flag}
            </span>
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
          aria-hidden
        />
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg shadow-lift">
          <div className="border-b border-border-light p-2">
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
              aria-label="Search countries"
              placeholder="Search countries..."
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-fg-subtle">No countries found</div>
          ) : (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={`${baseId}-label`}
              className="max-h-60 overflow-y-auto py-1"
            >
              {filtered.map((country, index) => {
                const isSelected = country.code === value
                const isActive = index === activeIndex
                return (
                  <li
                    key={country.code}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(country)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex min-h-10 cursor-pointer items-center gap-2 px-3 text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent-muted font-medium text-accent'
                        : isActive
                          ? 'bg-accent-muted/50 text-fg'
                          : 'text-fg'
                    }`}
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {country.flag}
                    </span>
                    <span>{country.name}</span>
                    <span className="ml-auto text-xs text-fg-subtle">{country.code}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
