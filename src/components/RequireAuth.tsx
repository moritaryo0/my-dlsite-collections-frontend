import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { type ReactNode } from 'react'

type Props = { children: ReactNode; redirectToSignup?: boolean }

export default function RequireAuth({ children, redirectToSignup = false }: Props) {
  const { me, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>読み込み中...</div>
  if (!me) {
    if (redirectToSignup) return <Navigate to="/signup" replace state={{ from: location }} />
    return (
      <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
        <div className="alert alert-warning" role="alert">
          このページを表示するにはログインが必要です。<br />
          <a className="btn btn-primary mt-2" href="/login">ログイン</a>
          <a className="btn btn-link ms-2 mt-2" href="/signup">新規登録</a>
        </div>
      </div>
    )
  }
  return <>{children}</>
}


