import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPosts, fetchContents } from '../lib/api'
import { getErrorMessage } from '../lib/error'
import type { UserPost, ContentData } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import ContentCard from '../components/ContentCard'
import { applyOgp } from '../lib/head'

export default function UserWorks() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { me } = useAuth()
  const [posts, setPosts] = useState<UserPost[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  useEffect(() => {
    (async () => {
      if (!username) return
      try {
        setLoading(true)
        setError(null)
        const [p, c] = await Promise.all([
          fetchPosts({ user_id: username }),
          fetchContents(),
        ])
        setPosts(p.data)
        setContents(c.data)
        // OGP/Twitterカードを動的設定
        try {
          const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
          const pageUrl = `${siteUrl}/users/${encodeURIComponent(username)}/works`
          const first = c.data?.[0]
          applyOgp({
            title: `${username} さんの登録作品 - 同人メーター`,
            description: `${username} さんが登録したお気に入りの作品一覧`,
            url: pageUrl,
            image: first?.image || '/ogp-default.png',
            siteName: '同人メーター',
            twitterSite: '@aokikyuran',
          })
        } catch {}
      } catch (e: any) {
        setError(getErrorMessage(e, '読み込みに失敗しました'))
      } finally {
        setLoading(false)
      }
    })()
  }, [username])

  const urlToContent = useMemo(() => contents.reduce((acc, c) => { acc[c.content_url] = c; return acc }, {} as Record<string, ContentData>), [contents])

  const contentTypes = useMemo(() => {
    const set = new Set<string>()
    contents.forEach(c => { if (c.content_type) set.add(c.content_type) })
    return Array.from(set)
  }, [contents])

  const toggleType = (t: string) => {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const getContentTypeBadgeStyle = (type?: string) => {
    if (type === 'ボイス・ASMR') {
      return { backgroundColor: 'transparent', color: '#fbeeca', border: '1px solid #fbeeca' }
    }
    if (type === '漫画・CG作品') {
      return { backgroundColor: 'transparent', color: '#e6f7d6', border: '1px solid #e6f7d6' }
    }
    if (type === 'ゲーム') {
      return { backgroundColor: 'transparent', color: '#f5eaff', border: '1px solid #f5eaff' }
    }
    return { backgroundColor: 'transparent', color: '#eee', border: '1px solid #eee' }
  }

  const getFilterBadgeStyle = (type: string, active: boolean) => {
    const base = getContentTypeBadgeStyle(type) as any
    if (active) {
      return { ...base, backgroundColor: base.color, color: '#222', borderColor: base.color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }
    }
    return base
  }

  const filteredPosts = useMemo(() => {
    if (selectedTypes.length === 0) return posts
    return posts.filter(p => {
      const t = urlToContent[p.content_url]?.content_type
      return t ? selectedTypes.includes(t) : false
    })
  }, [posts, selectedTypes, urlToContent])

  if (!username) return <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>ユーザー名が指定されていません。</div>

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <h2 className="mb-0" style={{ margin: 0, flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username} さんの登録作品</h2>
        <button className="btn btn-primary btn-sm" style={{ flex: '0 0 auto' }} onClick={() => navigate(me ? '/' : '/signup')}>
          自分のお気に入りを登録する
        </button>
      </div>

      {loading && <div>読み込み中...</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0 12px' }}>
        <button
          type="button"
          className="badge"
          onClick={() => setSelectedTypes([])}
          style={selectedTypes.length === 0 ? { backgroundColor: '#ddd', color: '#222', border: '1px solid #ddd' } : { backgroundColor: 'transparent', color: '#ccc', border: '1px solid #ccc' }}
        >すべて</button>
        {contentTypes.map(t => (
          <button
            key={t}
            type="button"
            className="badge"
            onClick={() => toggleType(t)}
            style={getFilterBadgeStyle(t, selectedTypes.includes(t))}
          >{t}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {filteredPosts.map(p => {
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
              onDeleted={async () => {
                // 自分のページであればリロードして反映
                if (me && me.username === username) {
                  try {
                    setLoading(true)
                    const [p2, c2] = await Promise.all([
                      fetchPosts({ user_id: username }),
                      fetchContents(),
                    ])
                    setPosts(p2.data)
                    setContents(c2.data)
                  } finally {
                    setLoading(false)
                  }
                }
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
