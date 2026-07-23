import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyLocales: Record<string, string> = {
  USD: 'en-US',
  NGN: 'en-NG',
  GHS: 'en-GH',
  KES: 'en-KE',
}

export function formatMoney(amount: string | number, currency = 'USD'): string {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : amount
  if (Number.isNaN(value)) return `${currency} 0.00`

  try {
    return new Intl.NumberFormat(currencyLocales[currency] ?? 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatFileSize(bytes: string | number | null | undefined): string {
  if (bytes == null || bytes === '') return ''
  const n = typeof bytes === 'string' ? Number.parseInt(bytes, 10) : bytes
  if (Number.isNaN(n) || n <= 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
