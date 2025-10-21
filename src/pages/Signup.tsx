import { useState } from 'react'
import { registerAccount, loginJwt, setAuthToken } from '../lib/api'
import { getErrorMessage } from '../lib/error'
import AboutSection from '../components/AboutSection'
import XLoginButton from '../components/XLoginButton'

export default function Signup() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Vite dev server proxy を利用して相対パスでバックエンドへ

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)
    try {
      await registerAccount({ username: form.username, password: form.password })
      const res = await loginJwt({ username: form.username, password: form.password })
      setAuthToken(res.data.access)
      window.location.replace('/')
    } catch (err: any) {
      setError(getErrorMessage(err, '登録に失敗しました'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 className="mb-3">新規登録</h2>
      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            className="form-control"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="ユーザー名"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="パスワード"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? '登録中...' : '登録する'}
        </button>
      </form>

      <div className="mt-3">
        <XLoginButton />
      </div>

      <div className="mt-3">
        <a className="btn btn-link p-0" href="/login">ログインはこちら</a>
      </div>

      {message && (
        <div className="alert alert-success mt-3" role="alert">
          {message}
        </div>
      )}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      <div className="mt-5">
        <h3 className="mb-3" style={{ fontSize: 18 }}>このサイトについて</h3>
        <AboutSection />
      </div>
    </div>
  )
}


