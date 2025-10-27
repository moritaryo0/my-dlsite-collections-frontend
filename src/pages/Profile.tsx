import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchPosts, fetchContents, fetchMyLists, type UserList } from '../lib/api'
import { getErrorMessage } from '../lib/error'
import type { UserPost, ContentData } from '../lib/api'
import ContentCard from '../components/ContentCard'

export default function Profile() {
  const { me, loading } = useAuth()
  const [posts, setPosts] = useState<UserPost[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'posts' | 'lists'>('posts')
  const [myLists, setMyLists] = useState<UserList[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    (async () => {
      if (!me) return
      try {
        setError(null)
        const [p, c, l] = await Promise.all([
          fetchPosts({ username: me.username }),
          fetchContents(),
          fetchMyLists(),
        ])
        setPosts(p.data)
        setContents(c.data)
        setMyLists(l.data || [])
      } catch (e: any) {
        setError(getErrorMessage(e, '読み込みに失敗しました'))
      }
    })()
  }, [me])

  const urlToContent = useMemo(() => contents.reduce((acc, c) => { acc[c.content_url] = c; return acc }, {} as Record<string, ContentData>), [contents])
  const listIdToList = useMemo(() => myLists.reduce((acc, l) => { acc[l.id] = l; return acc }, {} as Record<number, UserList>), [myLists])

  const renderGroupedByList = (items: UserPost[]) => {
    const groups = new Map<number | 'unknown', UserPost[]>()
    items.forEach(p => {
      const key = (p as any).list_id ?? 'unknown'
      const arr = groups.get(key) || []
      arr.push(p)
      groups.set(key, arr)
    })

    const orderedKeys: Array<number | 'unknown'> = [...myLists.map(l => l.id)]
    if (groups.has('unknown')) orderedKeys.push('unknown')

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {orderedKeys.filter(k => groups.has(k)).map(key => {
          const itemsInGroup = groups.get(key) || []
          const list = typeof key === 'number' ? listIdToList[key] : undefined
          const listName = list?.name ?? (typeof key === 'number' ? `リスト #${key}` : '未分類')
          const keyStr = String(key)
          const expanded = expandedGroups[keyStr] ?? true
          return (
            <section key={String(key)} className="card shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 12px' }} onClick={() => setExpandedGroups(v => ({ ...v, [keyStr]: !(v[keyStr] ?? true) }))}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!list?.is_public && list && <i className="bi bi-lock-fill" title="非公開" style={{ color: 'var(--bs-secondary-color)' }} />}
                  <a href={list ? `/users/${encodeURIComponent(me!.username)}/lists/${list.id}` : '#'} style={{ fontWeight: 600 }}>
                    {listName}
                  </a>
                </div>
                <span className="badge bg-secondary" title="お気に入り数">{list?.goot_count ?? 0}</span>
              </div>
              <div
                className="home-card-grid"
                style={{
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  padding: expanded ? '0 10px 10px' : '0 10px 0',
                  overflow: 'hidden',
                  maxHeight: expanded ? 2000 : 0,
                  opacity: expanded ? 1 : 0,
                  transform: expanded ? 'scale(1)' : 'scale(0.985)',
                  transition: 'max-height 0.25s ease, opacity 0.2s ease, transform 0.2s ease, padding-bottom 0.2s ease'
                }}
              >
                {itemsInGroup.map(p => {
                  const c = urlToContent[p.content_url]
                  return (
                    <ContentCard
                      key={p.id}
                      username={me!.username}
                      createdAt={p.created_at}
                      contentUrl={p.content_url}
                      image={c?.image}
                      title={c?.title || p.content_url}
                      description={p.description}
                      contentType={c?.content_type}
                      goodCount={c?.good_count}
                      postId={p.id}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

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
          <div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{me.username}</div>
            {me.email && <div style={{ color: 'var(--bs-secondary-color)' }}>{me.email}</div>}
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>投稿</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'lists' ? 'active' : ''}`} onClick={() => setActiveTab('lists')}>リスト</button>
        </li>
      </ul>

      {activeTab === 'posts' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h5 className="card-title" style={{ margin: 0 }}>あなたの登録した作品</h5>
            <button className="btn btn-outline-secondary btn-sm" onClick={openShare}>
              <i className="bi bi-share" /> リストを共有
            </button>
          </div>
          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}
          {renderGroupedByList(posts)}
        </>
      ) : (
        <div className="card shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <h5 className="card-title" style={{ margin: 0, marginBottom: 8 }}>あなたのリスト</h5>
            <ul className="list-group">
              {myLists.length === 0 && (
                <li className="list-group-item" style={{ color: 'var(--bs-secondary-color)' }}>まだリストがありません</li>
              )}
              {myLists.map(l => (
                <li key={l.id} className="list-group-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <a href={`/users/${encodeURIComponent(me!.username)}/lists/${l.id}`} style={{ fontWeight: 600 }}>{l.name}</a>
                    {l.description && <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>{l.description}</div>}
                  </div>
                  <span className="badge bg-secondary">{l.goot_count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
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
