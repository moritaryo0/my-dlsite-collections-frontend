import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchPosts, fetchContents } from '../lib/api'
import { getErrorMessage } from '../lib/error'
import type { UserPost, ContentData } from '../lib/api'

export default function Profile() {
  const { me, loading } = useAuth()
  const [posts, setPosts] = useState<UserPost[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    (async () => {
      if (!me) return
      try {
        setError(null)
        const [p, c] = await Promise.all([
          fetchPosts({ user_id: me.username }),
          fetchContents(),
        ])
        setPosts(p.data)
        setContents(c.data)
      } catch (e: any) {
        setError(getErrorMessage(e, '読み込みに失敗しました'))
      }
    })()
  }, [me])

  const urlToContent = useMemo(() => contents.reduce((acc, c) => { acc[c.content_url] = c; return acc }, {} as Record<string, ContentData>), [contents])

  const openShare = async () => {
    if (!me) return
    const url = `${window.location.origin}/users/${encodeURIComponent(me.username)}/works`
    setShareUrl(url)
    setShowShare(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('リンクをコピーしました')
    } catch {}
  }

  const shareToDiscord = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {}
    window.open('https://discord.com/app', '_blank')
  }

  const twitterHref = (() => {
    const text = `「${me?.username ?? ''}」の登録作品一覧`
    const u = new URL('https://twitter.com/intent/tweet')
    u.searchParams.set('text', text)
    u.searchParams.set('url', shareUrl)
    return u.toString()
  })()

  if (loading) return <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>読み込み中...</div>
  if (!me) return <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>未ログインです。</div>

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 className="mb-3">プロフィール</h2>
      <div className="card shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '9999px', background: 'var(--bs-secondary-bg)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{me.username}</div>
            {me.email && <div style={{ color: 'var(--bs-secondary-color)' }}>{me.email}</div>}
          </div>
        </div>
      </div>

      <div className="card shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h5 className="card-title" style={{ margin: 0 }}>あなたの登録した作品</h5>
            <button className="btn btn-outline-secondary btn-sm" onClick={openShare}>
              <i className="bi bi-share" /> リストを共有
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}

          <ul className="list-group list-group-flush">
            {posts.map(p => {
              const c = urlToContent[p.content_url]
              return (
                <li key={p.id} className="list-group-item" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {c?.image && (
                    <a href={p.content_url} target="_blank" rel="noreferrer">
                      <img src={c.image} alt={c.title || 'preview'} loading="lazy" decoding="async" style={{ width: 72, height: 'auto', display: 'block', objectFit: 'contain' }} />
                    </a>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <a href={p.content_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-word' as any, overflowWrap: 'anywhere' }}>
                      {c?.title || p.content_url}
                    </a>
                    {c?.content_type && (
                      <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>{c.content_type}</div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {showShare && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">リストを共有</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowShare(false)}></button>
              </div>
              <div className="modal-body" style={{ display: 'grid', gap: 8 }}>
                <label className="form-label">共有リンク</label>
                <div className="input-group">
                  <input className="form-control" value={shareUrl} readOnly />
                  <button className="btn btn-outline-secondary" onClick={copyToClipboard}>コピー</button>
                </div>
                <a className="btn btn-primary" href={twitterHref} target="_blank" rel="noreferrer">
                  <i className="bi bi-twitter-x" /> Twitterで共有
                </a>
                <button className="btn btn-secondary" type="button" onClick={shareToDiscord}>
                  <i className="bi bi-discord" /> Discordで共有
                </button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowShare(false)}>閉じる</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
