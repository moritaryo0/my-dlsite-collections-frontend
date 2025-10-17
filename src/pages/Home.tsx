import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchPosts, createPost, fetchContents } from '../lib/api'
import { getErrorMessage } from '../lib/error'
import type { UserPost, ContentData } from '../lib/api'
import ContentCard from '../components/ContentCard'
import { useAuth } from '../context/AuthContext'

type HomeProps = { bannerMessage?: string }

export default function Home(props: HomeProps) {
  const location = useLocation()
  const { me } = useAuth()
  const [allPosts, setAllPosts] = useState<UserPost[]>([])
  const [myPosts, setMyPosts] = useState<UserPost[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [form, setForm] = useState({ description: '', content_url: '' })
  const [contentType, setContentType] = useState<'ボイス・ASMR' | '漫画・CG作品' | 'ゲーム'>('ボイス・ASMR')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastCreated, setLastCreated] = useState<UserPost | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'profile'>('posts')

  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  async function loadLists(currentMe: { username: string } | null) {
    const reqAll = fetchPosts()
    const reqMy = currentMe ? fetchPosts({ user_id: currentMe.username }) : Promise.resolve({ data: [] as UserPost[] } as any)
    const reqContents = fetchContents()
    const [pAll, pMy, c] = await Promise.all([reqAll, reqMy, reqContents])
    setAllPosts(pAll.data)
    setMyPosts((pMy as any).data ?? [])
    setContents(c.data)
  }

  useEffect(() => {
    (async () => {
      try {
        // default tab from query
        const tab = urlParams.get('tab')
        if (tab === 'profile') setActiveTab('profile')
        await loadLists(me || null)
      } catch (err: any) {
        setErrorMessage(getErrorMessage(err, '初期データの取得に失敗しました'))
      }
    })()
  }, [urlParams, me])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setLastCreated(null)
    try {
      const payload = {
        user_id: me?.username || '',
        description: form.description,
        content_url: form.content_url,
        content_type: contentType,
      }
      const res = await createPost(payload)
      const created = (res.data && res.data.data) ? res.data.data as UserPost : null
      if (created) setLastCreated(created)
      await loadLists(me)
      setForm({ description: '', content_url: '' })
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, '投稿に失敗しました'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = !form.content_url || isSubmitting
  const urlToContent: Record<string, ContentData> = useMemo(() => contents.reduce((acc, c) => { acc[c.content_url] = c; return acc }, {} as Record<string, ContentData>), [contents])

  const renderCardGrid = (posts: UserPost[]) => (
    <div className="home-card-grid">
      {posts.map(p => {
        const c = urlToContent[p.content_url]
        return (
          <ContentCard
            key={p.id}
            username={p.user_id || 'anonymous'}
            createdAt={p.created_at}
            contentUrl={p.content_url}
            image={c?.image}
            title={c?.title || p.content_url}
            description={p.description}
            contentType={c?.content_type}
            goodCount={c?.good_count}
            postId={p.id}
            onDeleted={async () => { await loadLists(me) }}
          />
        )
      })}
    </div>
  )

  const renderMyList = (posts: UserPost[]) => (
    <div className="card shadow-sm" style={{ borderRadius: 12 }}>
      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 }}>
        <h5 className="card-title" style={{ margin: 0 }}>あなたの登録した作品</h5>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => {
          if (!me) return; const url = `${window.location.origin}/users/${encodeURIComponent(me.username)}/works`; setShareUrl(url); setShowShare(true);
        }}>
          <i className="bi bi-share" /> リストを共有
        </button>
      </div>
      <ul className="list-group list-group-flush">
        {posts.map(p => {
          const c = urlToContent[p.content_url]
          return (
            <li key={p.id} className="list-group-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {c?.image && (
                <a href={p.content_url} target="_blank" rel="noreferrer">
                  <img src={c.image} alt={c.title || 'preview'} loading="lazy" decoding="async" style={{ width: 72, height: 'auto', display: 'block', objectFit: 'contain' }} />
                </a>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <a href={p.content_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                  {c?.title || p.content_url}
                </a>
                {c?.content_type && (
                  <div style={{ marginTop: 4 }}>
                    <span className="badge" style={getContentTypeBadgeStyle(c.content_type)}>{c.content_type}</span>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )

  const twitterHref = (() => {
    if (!me) return '#'
    const text = `「${me.username}」の好きな作品を覗きに行きましょう`
    const u = new URL('https://twitter.com/intent/tweet')
    u.searchParams.set('text', text)
    u.searchParams.set('url', shareUrl)
    return u.toString()
  })()

  const shareToDiscord = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {}
    window.open('https://discord.com/app', '_blank')
  }

  // ---

  const getContentTypeBadgeStyle = (type?: string) => {
    if (type === 'ボイス・ASMR') {
      return { backgroundColor: 'transparent', color: '#fbeeca', border: '1px solid #fbeeca' } as React.CSSProperties
    }
    if (type === '漫画・CG作品') {
      return { backgroundColor: 'transparent', color: '#e6f7d6', border: '1px solid #e6f7d6' } as React.CSSProperties
    }
    if (type === 'ゲーム') {
      return { backgroundColor: 'transparent', color: '#f5eaff', border: '1px solid #f5eaff' } as React.CSSProperties
    }
    return { backgroundColor: 'transparent', color: '#eee', border: '1px solid #eee' } as React.CSSProperties
  }

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      {props.bannerMessage && (
        <div className="alert alert-info" role="alert" style={{ marginBottom: 12 }}>
          {props.bannerMessage}
        </div>
      )}
      <div className="card shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{me ? me.username : 'ゲスト'}</div>
          </div>
          <form onSubmit={submit} className="" style={{ display: 'grid', gap: 8 }}>
            <div className="d-flex gap-3 align-items-center">
              <div className="form-check">
                <input className="form-check-input" type="radio" name="content_type" id="ct-voice" value="ボイス・ASMR" checked={contentType === 'ボイス・ASMR'} onChange={() => setContentType('ボイス・ASMR')} />
                <label className="form-check-label" htmlFor="ct-voice">ボイス・ASMR</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="content_type" id="ct-manga" value="漫画・CG作品" checked={contentType === '漫画・CG作品'} onChange={() => setContentType('漫画・CG作品')} />
                <label className="form-check-label" htmlFor="ct-manga">漫画・CG作品</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="content_type" id="ct-game" value="ゲーム" checked={contentType === 'ゲーム'} onChange={() => setContentType('ゲーム')} />
                <label className="form-check-label" htmlFor="ct-game">ゲーム</label>
              </div>
            </div>
            <input className="form-control" placeholder="作品リンク (例: http://dlsite.com/~)" value={form.content_url} onChange={e=>setForm({...form, content_url:e.target.value})}/>
            <textarea className="form-control" rows={5} placeholder="本文,感想など(任意)" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => { if (!me) return; const url = `${window.location.origin}/users/${encodeURIComponent(me.username)}/works`; setShareUrl(url); setShowShare(true); }}
                >
                  <i className="bi bi-share" /> リストを共有
                </button>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isDisabled}>{isSubmitting ? '投稿中...' : '投稿'}</button>
            </div>
          </form>
          {errorMessage && (
            <div className="alert alert-danger mt-3" role="alert">
              エラー: {errorMessage}
            </div>
          )}
          {lastCreated && (
            <div className="alert alert-success mt-3" role="alert">
              投稿が完了しました。
            </div>
          )}
        </div>
      </div>

      {me ? (
        <>
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>投稿一覧</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>プロフィール</button>
            </li>
          </ul>
          {activeTab === 'posts' ? (
            renderCardGrid(myPosts)
          ) : (
            renderMyList(myPosts)
          )}
        </>
      ) : (
        <>
          <h2 style={{ marginTop: 12 }}>投稿一覧</h2>
          {renderCardGrid(allPosts)}
        </>
      )}

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
                  <button className="btn btn-outline-secondary" onClick={async () => { try { await navigator.clipboard.writeText(shareUrl); alert('リンクをコピーしました') } catch {} }}>コピー</button>
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