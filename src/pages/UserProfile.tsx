import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPosts, fetchContents, fetchListsByUser, type UserList } from '../lib/api'
import { getErrorMessage } from '../lib/error'
import type { UserPost, ContentData } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import ContentCard from '../components/ContentCard'

export default function UserProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { me } = useAuth()
  const [posts, setPosts] = useState<UserPost[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'works' | 'lists'>('posts')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lists, setLists] = useState<UserList[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const urlToContent = useMemo(() => contents.reduce((acc, c) => { acc[c.content_url] = c; return acc }, {} as Record<string, ContentData>), [contents])

  useEffect(() => {
    // redirect if current user's page
    if (me && username && me.username === username) {
      navigate('/', { replace: true })
      return
    }
    (async () => {
      if (!username) return
      try {
        setLoading(true)
        setError(null)
        const [p, c, l] = await Promise.all([
          fetchPosts({ username }),
          fetchContents(),
          fetchListsByUser(username),
        ])
        setPosts(p.data ?? [])
        setContents(c.data ?? [])
        setLists(l.data ?? [])
      } catch (e: any) {
        setError(getErrorMessage(e, '読み込みに失敗しました'))
      } finally {
        setLoading(false)
      }
    })()
  }, [username])

  const listIdToList = useMemo(() => lists.reduce((acc, l) => { acc[l.id] = l; return acc }, {} as Record<number, UserList>), [lists])

  const renderGroupedByList = (items: UserPost[]) => {
    const groups = new Map<number | 'unknown', UserPost[]>()
    items.forEach(p => {
      const key = (p as any).list_id ?? 'unknown'
      const arr = groups.get(key) || []
      arr.push(p)
      groups.set(key, arr)
    })

    const orderedKeys: Array<number | 'unknown'> = [...lists.map(l => l.id)]
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
                  <a href={list ? `/users/${encodeURIComponent(username!)}/lists/${list.id}` : '#'} style={{ fontWeight: 600 }}>
                    {listName}
                  </a>
                </div>
                {/* 公開ユーザーのプロフィールでは右上の数は非表示。編集メニューも出さない */}
                <span style={{ display: 'none' }} />
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
                      username={username}
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

  const renderWorksList = (items: UserPost[]) => (
    <div className="card shadow-sm" style={{ borderRadius: 12 }}>
      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 }}>
        <h5 className="card-title" style={{ margin: 0 }}>{username} さんの登録した作品</h5>
      </div>
      <ul className="list-group list-group-flush">
        {items.map(p => {
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
                <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>{new Date(p.created_at ?? Date.now()).toLocaleString()}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )

  if (!username) return <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>ユーザーが見つかりません。</div>
  if (loading) return <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>読み込み中...</div>

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <div className="card shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{username}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--bs-secondary-color)', fontSize: 12, marginTop: 2 }}>
                <span>登録 {posts.length}</span>
                <span><i className="bi bi-heart-fill" /> {lists.reduce((acc, l) => acc + (l.goot_count || 0), 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>投稿一覧</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'works' ? 'active' : ''}`} onClick={() => setActiveTab('works')}>登録作品</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'lists' ? 'active' : ''}`} onClick={() => setActiveTab('lists')}>リスト</button>
        </li>
      </ul>

      {activeTab === 'posts' ? renderGroupedByList(posts) : activeTab === 'works' ? renderWorksList(posts) : (
        <div className="card shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <h5 className="card-title" style={{ margin: 0, marginBottom: 8 }}>{username} さんの公開リスト</h5>
            <ul className="list-group">
              {lists.length === 0 && (
                <li className="list-group-item" style={{ color: 'var(--bs-secondary-color)' }}>公開リストはありません</li>
              )}
              {lists.map(l => (
                <li key={l.id} className="list-group-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <a href={`/users/${encodeURIComponent(username!)}/lists/${l.id}`} style={{ fontWeight: 600 }}>{l.name}</a>
                    {l.description && <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>{l.description}</div>}
                  </div>
                  {/* いいね数の表示は非表示に変更 */}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}


