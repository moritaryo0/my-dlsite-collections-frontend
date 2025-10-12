import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPosts, fetchContents } from '../lib/api'
import type { UserPost, ContentData } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import ContentCard from '../components/ContentCard'

export default function UserWorks() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { me } = useAuth()
  const [posts, setPosts] = useState<UserPost[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      } catch (e: any) {
        setError(e?.message || '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    })()
  }, [username])

  const urlToContent = useMemo(() => contents.reduce((acc, c) => { acc[c.content_url] = c; return acc }, {} as Record<string, ContentData>), [contents])

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

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {posts.map(p => {
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
