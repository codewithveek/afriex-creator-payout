/**
 * The buyer's bearer token, kept in localStorage and exposed as an external
 * store so React can subscribe to it (`useSyncExternalStore`).
 *
 * localStorage, not sessionStorage: the server keeps a buyer session for a
 * week, and a token that dies with the browser tab is why signed-in buyers kept
 * being shown a login form.
 */

const TOKEN_KEY = 'customerToken'

/**
 * Companion flag cookie — no token, just "a buyer session exists". The server
 * can't read localStorage, and without this hint every page would have to
 * server-render the signed-out header and correct itself after hydration.
 */
const HINT_COOKIE = 'acp.buyer'
const HINT_MAX_AGE = 7 * 24 * 60 * 60 // matches the server's session lifetime

type Listener = () => void

const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener()
}

/** Storage throws when the browser blocks it (private mode, strict settings). */
function safeRead(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeWrite(storage: Storage, key: string, value: string | null) {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, value)
  } catch {
    // Sign-in still works for this page load, it just won't be remembered.
  }
}

function setHintCookie(present: boolean) {
  if (typeof document === 'undefined') return
  document.cookie = present
    ? `${HINT_COOKIE}=1; path=/; max-age=${HINT_MAX_AGE}; samesite=lax`
    : `${HINT_COOKIE}=; path=/; max-age=0; samesite=lax`
}

/** One-time move of tokens written by the old sessionStorage implementation. */
function migrateLegacyToken() {
  const legacy = safeRead(sessionStorage, TOKEN_KEY)
  if (!legacy) return
  if (!safeRead(localStorage, TOKEN_KEY)) {
    safeWrite(localStorage, TOKEN_KEY, legacy)
    setHintCookie(true)
  }
  safeWrite(sessionStorage, TOKEN_KEY, null)
}

if (typeof window !== 'undefined') migrateLegacyToken()

export function readCustomerToken(): string | null {
  if (typeof window === 'undefined') return null
  return safeRead(localStorage, TOKEN_KEY)
}

export function writeCustomerToken(token: string) {
  safeWrite(localStorage, TOKEN_KEY, token)
  setHintCookie(true)
  emit()
}

export function clearCustomerToken() {
  safeWrite(localStorage, TOKEN_KEY, null)
  safeWrite(sessionStorage, TOKEN_KEY, null)
  setHintCookie(false)
  emit()
}

export function subscribeCustomerToken(listener: Listener) {
  listeners.add(listener)
  // `storage` only fires in *other* tabs, which is exactly the cross-tab case;
  // same-tab writes notify through `emit`.
  const handleStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}
