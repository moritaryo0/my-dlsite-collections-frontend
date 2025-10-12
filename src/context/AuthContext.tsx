import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchMe, logoutJwt, restoreAuthFromStorage } from '../lib/api'
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
