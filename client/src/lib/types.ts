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

export interface Creator {
  id: string
  userId: string
  availableBalance: string
  payoutCurrency: string
  payoutEligible: boolean
  phone: string | null
  country: string | null
  lastWithdrawalAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PayoutMethod {
  id: string
  creatorId: string
  type?: string
  currency: string
  bankName: string | null
  maskedAccountNumber: string | null
  status: 'PENDING' | 'VERIFIED' | 'REVOKED' | string
  isDefault?: boolean
  afriexCustomerId: string | null
  afriexPaymentMethodId: string | null
  details?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Withdrawal {
  id: string
  creatorId: string
  payoutMethodId: string
  amount: string
  currency: string
  status: 'QUEUED' | 'PENDING' | 'PROCESSING' | 'PAID' | 'COMPLETED' | 'FAILED' | string
  afriexTransactionId: string | null
  errorMessage: string | null
  failureReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface SaleRecord {
  id: string
  creatorId: string
  paymentIntentId: string
  grossAmount: string
  currency: string
  status: string
  /** @deprecated use grossAmount */
  amount?: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt?: string
}

export interface Product {
  id: string
  creatorId: string
  name: string
  description: string | null
  price: string
  currency: string
  fileUrl: string | null
  fileName: string | null
  fileSize: string | null
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  productId: string
  creatorId: string
  customerId: string | null
  customerEmail: string
  customerName: string
  amount: string
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED'
  paymentSessionId: string
  downloadToken: string | null
  createdAt: string
  updatedAt: string
  product?: Product
}

export interface Customer {
  id: string
  email: string
  name: string
  token?: string
}

export interface PaymentCollector {
  id: 'paystack' | 'flutterwave' | 'afriex-checkout' | 'stripe'
  name: string
  description: string
  primary: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
