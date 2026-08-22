export const queryKeys = {
  collectors: ['checkout', 'collectors'] as const,
  institutions: (channel: string) => ['payout-methods', 'institutions', channel] as const,
  orderBySession: (sessionId: string) => ['orders', 'by-session', sessionId] as const,
  admin: {
    all: ['admin'] as const,
    creators: ['admin', 'creators'] as const,
    withdrawals: ['admin', 'withdrawals'] as const,
    sales: ['admin', 'sales'] as const,
    poolAccounts: ['admin', 'pool-accounts'] as const,
  },
}
