import { api } from '@/lib/api-client'
import type { PaymentCollector } from '@/lib/types'

const FALLBACK_COLLECTORS: PaymentCollector[] = [
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Cards, bank transfer, USSD, mobile money',
    primary: true,
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Cards, bank, and mobile money',
    primary: true,
  },
  {
    id: 'afriex-checkout',
    name: 'Afriex Checkout',
    description: 'Bank transfer to a one-time account, or mobile money',
    primary: false,
  },
]

export async function fetchCollectors(): Promise<PaymentCollector[]> {
  try {
    const res = await api.get<{ data: PaymentCollector[] }>('/api/checkout/collectors')
    return res.data?.length ? res.data : FALLBACK_COLLECTORS
  } catch {
    return FALLBACK_COLLECTORS
  }
}

export interface CreateCheckoutInput {
  productId: string
  customerEmail: string
  customerName: string
  paymentProvider: PaymentCollector['id']
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(input: CreateCheckoutInput) {
  return api.post<{ data: { sessionId: string; sessionUrl: string; provider: string } }>(
    '/api/checkout/sessions',
    input,
  )
}
