import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchMe, logoutJwt, restoreAuthFromStorage, setAuthToken } from '../lib/api'
import type { Me } from '../lib/api'

type AuthContextValue = {
  me: Me | null
  loading: boolean
  reloadMe: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchMe()
      setMe(res.data)
    } catch {
      setMe(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try { restoreAuthFromStorage() } catch {}
    // ?access=...&refresh=... をどのページでも捕捉
    const params = new URLSearchParams(window.location.search)
    const access = params.get('access')
    const refresh = params.get('refresh')
    if (access && refresh) {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setAuthToken(access)
      const { origin, pathname, hash } = window.location
      window.history.replaceState({}, '', `${origin}${pathname}${hash || ''}`)
    }
    load()
  }, [])

  return (
    <AuthContext.Provider value={{ me, loading, reloadMe: load, logout: async () => { await logoutJwt(); setMe(null) } }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
