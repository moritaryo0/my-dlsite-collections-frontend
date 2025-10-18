import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { renameUsername } from '../lib/api'
import { getErrorMessage } from '../lib/error'

export default function Settings() {
  const { logout, loading, me, reloadMe } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'account' | 'rename'>('account')
  const [newName, setNewName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmitRename = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setSubmitting(true)
    try {
      const name = newName.trim()
      if (!name) throw new Error('ユーザー名を入力してください')
      await renameUsername({ username: name })
      await reloadMe()
      setMessage('ユーザー名を変更しました')
      setNewName('')
      setActiveTab('account')
    } catch (err: any) {
      setError(getErrorMessage(err, 'ユーザー名の変更に失敗しました'))
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2>設定</h2>
      <div style={{ marginTop: 12, color: '#6b7280' }}>{me ? `ログイン中: ${me.username}` : '未ログイン'}</div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          onClick={() => setActiveTab('account')}
          className="btn btn-outline-secondary"
          style={{ padding: '6px 10px', borderRadius: 6, ...(activeTab === 'account' ? { background: '#e5e7eb' } : {}) }}
        >アカウント</button>
        <button
          onClick={() => setActiveTab('rename')}
          className="btn btn-outline-secondary"
          style={{ padding: '6px 10px', borderRadius: 6, ...(activeTab === 'rename' ? { background: '#e5e7eb' } : {}) }}
        >名前変更</button>
      </div>

      {activeTab === 'account' && (
        <div>
          <button
            onClick={async () => { await logout(); navigate('/login', { replace: true }) }}
            disabled={loading}
            style={{ marginTop: 16, padding: '8px 12px', background: '#ef4444', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer' }}
          >ログアウト</button>
        </div>
      )}

      {activeTab === 'rename' && (
        <form onSubmit={onSubmitRename} style={{ marginTop: 16, maxWidth: 460 }}>
          <div className="mb-3">
            <label className="form-label">新しいユーザー名</label>
            <input
              className="form-control"
              placeholder="例: aozora_reader"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={255}
              required
            />
            <div className="form-text">半角英数・記号を含め最大255文字。</div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '変更中...' : '変更する'}
          </button>
        </form>
      )}

      {message && (
        <div className="alert alert-success mt-3" role="alert">{message}</div>
      )}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">{error}</div>
      )}
      
    </div>
  )
}
