export interface User {
  id: string
  email: string
  name: string
  role: 'CREATOR' | 'ADMIN'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface Session {
  user: User
  session: {
    id: string
    expiresAt: string
    createdAt: string
  }
}

export interface PayoutMethod {
  id: string
  creatorId: string
  type: string
  currency: string
  details: Record<string, unknown>
  isDefault: boolean
  afriexCustomerId: string | null
  afriexPaymentMethodId: string | null
  createdAt: string
  updatedAt: string
}

export interface Withdrawal {
  id: string
  creatorId: string
  payoutMethodId: string
  amount: string
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  afriexTransactionId: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface SaleRecord {
  id: string
  creatorId: string
  amount: string
  currency: string
  description: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
