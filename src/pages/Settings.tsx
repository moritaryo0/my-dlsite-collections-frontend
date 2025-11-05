import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { renameUsername, getPrivacy, setPrivacy } from '../lib/api'
import { getErrorMessage } from '../lib/error'

export default function Settings() {
  const { logout, loading, me, reloadMe } = useAuth()
  const navigate = useNavigate()
  const [openAccount, setOpenAccount] = useState(true)
  const [openRename, setOpenRename] = useState(false)
  const [openPrivacy, setOpenPrivacy] = useState(false)
  const [newName, setNewName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState<boolean>(false)

  // load privacy on mount
  useEffect(() => {
    (async () => {
      if (!me) return
      try {
        const res = await getPrivacy()
        setIsPrivate(!!res.data.private)
      } catch {}
    })()
  }, [me])

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
      setOpenRename(false)
      setOpenAccount(true)
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

      {/* リスト＋トグル表示 */}
      <div className="mt-3">
        <div className="card mb-2">
          <button type="button" className="btn btn-dark text-start w-100" onClick={() => setOpenAccount(v => !v)}>
            アカウント
          </button>
          {openAccount && (
            <div className="card-body">
              {me ? (
                <button
                  onClick={async () => { await logout(); navigate('/login', { replace: true }) }}
                  disabled={loading}
                  style={{ marginTop: 4, padding: '8px 12px', background: '#ef4444', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                >ログアウト</button>
              ) : (
                <div style={{ marginTop: 4, padding: '8px 12px', color: 'var(--bs-secondary-color)' }}>
                  ログインしていません。<a href="/login">ログイン</a>または<a href="/signup">新規登録</a>
                </div>
              )}
            </div>
          )}
        </div>

        {me && (
          <>
            <div className="card mb-2">
              <button type="button" className="btn btn-dark text-start w-100" onClick={() => setOpenRename(v => !v)}>
                名前変更
              </button>
              {openRename && (
                <div className="card-body">
                  <form onSubmit={onSubmitRename} style={{ maxWidth: 460 }}>
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
                </div>
              )}
            </div>

            <div className="card mb-2">
              <button type="button" className="btn btn-dark text-start w-100" onClick={() => setOpenPrivacy(v => !v)}>
                プライバシー
              </button>
              {openPrivacy && (
                <div className="card-body">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="privateSwitch"
                      checked={isPrivate}
                      onChange={async (e) => {
                        const v = e.target.checked
                        try {
                          setError(null)
                          const res = await setPrivacy(v)
                          setIsPrivate(res.data.private)
                          setMessage(res.data.private ? 'アカウントを非公開にしました' : 'アカウントを公開にしました')
                        } catch (err: any) {
                          setError(getErrorMessage(err, '更新に失敗しました'))
                        }
                      }} />
                    <label className="form-check-label" htmlFor="privateSwitch">非公開（探すページの投稿一覧に表示されなくなります）</label>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      

      {message && (
        <div className="alert alert-success mt-3" role="alert">{message}</div>
      )}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">{error}</div>
      )}
      
    </div>
  )
}
