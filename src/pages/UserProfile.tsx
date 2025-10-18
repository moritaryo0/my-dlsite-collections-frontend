import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPosts, fetchContents } from '../lib/api'
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
  const [activeTab, setActiveTab] = useState<'posts' | 'works'>('posts')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        const [p, c] = await Promise.all([
          fetchPosts({ username }),
          fetchContents(),
        ])
        setPosts(p.data ?? [])
        setContents(c.data ?? [])
      } catch (e: any) {
        setError(getErrorMessage(e, '読み込みに失敗しました'))
      } finally {
        setLoading(false)
      }
    })()
  }, [username])

  const renderCardGrid = (items: UserPost[]) => (
    <div className="profile-card-grid">
      {items.map(p => {
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
  )

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
            <div style={{ width: 48, height: 48, borderRadius: '9999px', background: 'var(--bs-secondary-bg)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{username}</div>
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
      </ul>

      {activeTab === 'posts' ? renderCardGrid(posts) : renderWorksList(posts)}
    </div>
  )
}


