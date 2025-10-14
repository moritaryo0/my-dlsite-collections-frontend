import { useState } from 'react'
import { loginJwt, setAuthToken } from '../lib/api'
import { getErrorMessage } from '../lib/error'
import AboutSection from '../components/AboutSection'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)
    try {
      const res = await loginJwt({ username: form.username, password: form.password })
      const { access, refresh } = res.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setAuthToken(access)
      window.location.replace('/')
    } catch (err: any) {
      setError(getErrorMessage(err, 'ログインに失敗しました'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 className="mb-3">ログイン</h2>
      <form onSubmit={submit} className="" style={{ maxWidth: 420 }}>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            className="form-control"
            value={form.username}
            onChange={e=>setForm({ ...form, username: e.target.value })}
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
            onChange={e=>setForm({ ...form, password: e.target.value })}
            placeholder="パスワード"
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          <i className="bi bi-box-arrow-in-right" /> {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <div className="mt-3">
        <a className="btn btn-link p-0" href="/signup">新規登録はこちら</a>
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
