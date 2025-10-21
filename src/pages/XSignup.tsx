import { useEffect, useState } from 'react'
import { renameUsername, setAuthToken } from '../lib/api'
import { getErrorMessage } from '../lib/error'

export default function XSignup() {
  const [username, setUsername] = useState('')
  const [, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // 受け取ったクエリトークンを適用
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const access = params.get('access')
    const refresh = params.get('refresh')
    if (access && refresh) {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setAuthToken(access)
      // クエリは残してOK（任意で消す場合はreplaceStateする）
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      // 未入力ならそのまま続行（ホームへ）
      if (!username.trim()) {
        window.location.replace('/')
        return
      }
      await renameUsername({ username: username.trim() })
      setMessage('ユーザー名を更新しました')
      setTimeout(() => window.location.replace('/'), 500)
    } catch (err: any) {
      setError(getErrorMessage(err, 'ユーザー名の更新に失敗しました'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 className="mb-3">Xサインアップ</h2>
      <p className="text-secondary" style={{ fontSize: 14 }}>初回ログインです。必要に応じてユーザー名を変更してください。</p>
      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <div className="mb-3">
          <label className="form-label">新しいユーザー名（任意）</label>
          <input className="form-control" value={username} onChange={e=>setUsername(e.target.value)} placeholder="ユーザー名" />
        </div>
        <button type="submit" className="btn btn-primary">続行</button>
      </form>

      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  )
}


