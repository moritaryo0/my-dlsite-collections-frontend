import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPosts, fetchContents, fetchMyLists, fetchListPublic, fetchListsByUser, gootList, type ContentData, type UserPost } from '../lib/api'
import { getErrorMessage } from '../lib/error'
import { useAuth } from '../context/AuthContext'
import ContentCard from '../components/ContentCard'
import { applyOgp } from '../lib/head'

export default function UserListWorks() {
  const { username, listId } = useParams()
  const navigate = useNavigate()
  const { me } = useAuth()
  // works → Homeリストへ自動遷移
  useEffect(() => {
    if (!username) return
    if (listId) return
    (async () => {
      try {
        const res = await fetchListsByUser(username)
        const lists = (res.data || []) as any[]
        const home = lists.find((l) => l.name === 'Home')
        if (home) {
          navigate(`/users/${encodeURIComponent(username)}/lists/${home.id}`, { replace: true })
        } else {
          navigate(`/users/${encodeURIComponent(username)}`, { replace: true })
        }
      } catch {
        navigate(`/users/${encodeURIComponent(username)}`, { replace: true })
      }
    })()
  }, [username, listId, navigate])
  const [posts, setPosts] = useState<UserPost[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listName, setListName] = useState<string>('リスト')
  const [isGoot, setIsGoot] = useState<boolean>(false)
  const [gootCount, setGootCount] = useState<number>(0)
  const [isPublic, setIsPublic] = useState<boolean>(false)
  const [gootAnimating, setGootAnimating] = useState<boolean>(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [forbidden, setForbidden] = useState<boolean>(false)

  useEffect(() => {
    (async () => {
      if (!username || !listId) return
      try {
        setLoading(true)
        setError(null)
        const [p, c] = await Promise.all([
          fetchPosts({ list_id: Number(listId) }),
          fetchContents(),
        ])
        const listPosts = p.data
        setPosts(listPosts)
        setContents(c.data)
        try {
          if (me && me.username === username) {
            const lists = await fetchMyLists()
            const found = (lists.data || []).find(l => l.id === Number(listId))
            if (found) {
              setListName(found.name)
              setIsPublic(!!found.is_public)
              setIsGoot(!!found.is_goot)
              setGootCount(found.goot_count || 0)
            }
          } else {
            // 公開APIからリスト詳細を取得
            const detail = await fetchListPublic(Number(listId))
            setListName(detail.data.name)
            setIsPublic(!!(detail.data as any).is_public)
            if (typeof (detail.data as any).is_goot === 'boolean') setIsGoot((detail.data as any).is_goot)
            if (typeof (detail.data as any).goot_count === 'number') setGootCount((detail.data as any).goot_count)
          }
        } catch (e: any) {
          // 非公開などで取得失敗（403時はタイトル表示と申請UI表示）
          const status = e?.response?.status
          if (status === 403) {
            setForbidden(true)
            const data = e?.response?.data
            if (data?.name) setListName(data.name)
            setError(null)
          } else {
            setError(getErrorMessage(e, 'リスト情報の取得に失敗しました'))
          }
        }
        // OGP設定（名前が確定した後に実行）
        try {
          const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
          const pageUrl = `${siteUrl}/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(listId)}`
          const first = c.data?.[0]
          const title = `${username} さんの「${(listName || 'リスト')}」 - 同人メーター`
          const desc = `${username} さんのリスト「${(listName || 'リスト')}」の作品一覧`
          applyOgp({
            title,
            description: desc,
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
  }, [username, listId, me])

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
  const getFilterBadgeStyle = (type: string, active: boolean) => {
    const base = getContentTypeBadgeStyle(type) as any
    if (active) {
      return { ...base, backgroundColor: base.color, color: '#222', borderColor: base.color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }
    }
    return base
  }

  const twitterHref = (() => {
    const text = `${username} さんの「${(listName || 'リスト')}」`
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
  const onToggleGoot = async () => {
    if (!listId || !me) return
    try {
      setGootAnimating(true)
      const res = await gootList(Number(listId))
      setIsGoot(res.data.is_goot)
      setGootCount(res.data.goot_count)
    } catch (e: any) {
      alert(getErrorMessage(e, 'お気に入りの更新に失敗しました'))
    } finally {
      setTimeout(() => setGootAnimating(false), 300)
    }
  }
  const filteredPosts = useMemo(() => {
    if (selectedTypes.length === 0) return posts
    return posts.filter(p => {
      const t = urlToContent[p.content_url]?.content_type
      return t ? selectedTypes.includes(t) : false
    })
  }, [posts, selectedTypes, urlToContent])

  

  if (!username) return <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>URLが不正です。</div>
  if (!listId) return <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>リダイレクト中...</div>

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <h2 className="mb-0" style={{ margin: 0, flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username} さんの「{listName}」</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {me && isPublic && (
            <button
              className={`btn btn-${isGoot ? 'danger' : 'outline-danger'} btn-sm`}
              onClick={onToggleGoot}
              style={{ transform: gootAnimating ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.2s ease' }}
              title={isGoot ? 'お気に入り解除' : 'お気に入りに追加'}
            >
              <i className={`bi ${isGoot ? 'bi-heart-fill' : 'bi-heart'}`} /> {gootCount}
            </button>
          )}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              const site = typeof window !== 'undefined' ? window.location.origin : ''
              const url = `${site}/users/${encodeURIComponent(username || '')}/lists/${encodeURIComponent(listId || '')}`
              setShareUrl(url)
              setShowShare(true)
            }}
            title="このリストを共有"
          >
            <i className="bi bi-share" /> 共有
          </button>
          <button className="btn btn-primary btn-sm" style={{ flex: '0 0 auto' }} onClick={() => navigate(me ? '/' : '/signup')}>
            自分のお気に入りを登録する
          </button>
        </div>
      </div>

      {loading && <div>読み込み中...</div>}
      {forbidden ? (
        <div className="alert alert-info" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>このリストは非公開です</div>
          <button className="btn btn-primary btn-sm" onClick={() => alert('承認申請（仮）を送信しました')}>承認申請</button>
        </div>
      ) : (
        error && <div className="alert alert-danger" role="alert">{error}</div>
      )}

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
              username={p.user?.username || username}
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


