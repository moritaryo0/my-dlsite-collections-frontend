import { useEffect, useMemo, useState } from 'react'
import { fetchPublicUsers, type PublicUser } from '../lib/api'

function PublicUserCard({ user }: { user: PublicUser }) {
  const [expanded, setExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 768px)').matches
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const maxCollapsed = isMobile ? 4 : 5
  const posts = expanded ? user.posts : user.posts.slice(0, maxCollapsed)
  if (user.posts.length === 0) return null
  return (
    <div className="card mb-3">
      <div className="card-body" style={{ paddingBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          <a href={`/users/${encodeURIComponent(user.username)}`} style={{ textDecoration: 'none' }}>@{user.username}</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
          {posts.map((p) => (
            <a key={p.id} href={p.content_url} target="_blank" rel="noreferrer" className="card" style={{ textDecoration: 'none' }}>
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.title || 'preview'}
                  loading="lazy"
                  style={{ width: '100%', height: isMobile ? 'auto' : 96, objectFit: isMobile ? 'contain' : 'cover' }}
                />
              ) : (
                <div style={{ height: isMobile ? 100 : 96, background: '#1f2937' }} />
              )}
              <div className="card-body" style={{ padding: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--bs-body-color)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                  {p.title || p.content_url}
                </div>
              </div>
            </a>
          ))}
        </div>
        {user.posts.length > maxCollapsed && (
          <div className="mt-2" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setExpanded((e) => !e)}>
              {expanded ? '閉じる' : 'もっと見る'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PublicUsersList() {
  const [allUsers, setAllUsers] = useState<PublicUser[]>([])
  const [page, setPage] = useState(0)
  const pageSize = 10

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchPublicUsers()
        setAllUsers(res.data)
      } catch {
        setAllUsers([])
      }
    })()
  }, [])

  const users = useMemo(() => {
    const start = page * pageSize
    return allUsers.slice(start, start + pageSize)
  }, [allUsers, page])

  const hasPrev = page > 0
  const hasNext = (page + 1) * pageSize < allUsers.length

  return (
    <div>
      {users.filter((u) => u.posts.length > 0).map((u) => (
        <PublicUserCard key={u.username} user={u} />
      ))}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button className="btn btn-outline-secondary btn-sm" disabled={!hasPrev} onClick={() => setPage(p => Math.max(0, p - 1))}>前へ</button>
        <button className="btn btn-outline-secondary btn-sm" disabled={!hasNext} onClick={() => setPage(p => p + 1)}>次へ</button>
      </div>
    </div>
  )
}


