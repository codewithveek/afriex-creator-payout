export const queryKeys = {
  collectors: ['checkout', 'collectors'] as const,
  orderBySession: (sessionId: string) => ['orders', 'by-session', sessionId] as const,
  customerOrders: (token: string) => ['customers', 'orders', token] as const,
  admin: {
    all: ['admin'] as const,
    creators: ['admin', 'creators'] as const,
    withdrawals: ['admin', 'withdrawals'] as const,
    sales: ['admin', 'sales'] as const,
    poolAccounts: ['admin', 'pool-accounts'] as const,
  },
}
