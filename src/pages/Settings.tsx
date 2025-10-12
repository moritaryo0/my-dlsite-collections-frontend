import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { logout, loading, me } = useAuth()
  const navigate = useNavigate()
  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2>設定</h2>
      <div style={{ marginTop: 12, color: '#6b7280' }}>
        {me ? `ログイン中: ${me.username}` : '未ログイン'}
      </div>
      <button
        onClick={async () => { await logout(); navigate('/login', { replace: true }) }}
        disabled={loading}
        style={{
          marginTop: 16,
          padding: '8px 12px',
          background: '#ef4444',
          color: 'white',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer'
        }}
      >ログアウト</button>
    </div>
  )
}
