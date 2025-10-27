import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchPosts, createPost, fetchContents, fetchMyLists, createList, fetchFavoriteLists, updateList, renameList, toggleListPublic, deleteList, type UserList } from '../lib/api'
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
  const [activeTab, setActiveTab] = useState<'posts' | 'profile' | 'lists'>('posts')
  const [myLists, setMyLists] = useState<UserList[]>([])
  const [showCreateList, setShowCreateList] = useState(false)
  const [newList, setNewList] = useState<{ name: string; description: string; is_public: boolean }>({ name: '', description: '', is_public: true })
  const [selectedListId, setSelectedListId] = useState<number | ''>('')
  const [favoriteLists, setFavoriteLists] = useState<UserList[]>([])
  const [favListPosts, setFavListPosts] = useState<UserPost[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [userFilter, setUserFilter] = useState<'all' | 'mine' | 'others'>('all')
  const [showUpdatePop, setShowUpdatePop] = useState<boolean>(() => {
    try { return localStorage.getItem('update_pop_hidden_2025-10-21') !== '1' } catch { return true }
  })

  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [shareListId, setShareListId] = useState<number | ''>('')
  const [updatingListId, setUpdatingListId] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [openListMenuKey, setOpenListMenuKey] = useState<string | null>(null)
  const [renameState, setRenameState] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' })
  const [deleteState, setDeleteState] = useState<{ open: boolean; id: number | null; name: string; loading: boolean }>({ open: false, id: null, name: '', loading: false })
  const [successPop, setSuccessPop] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState<number>(40)

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const listIdToList = useMemo(() => {
    const merged = [...myLists, ...favoriteLists]
    return merged.reduce((acc, l) => { acc[l.id] = l; return acc }, {} as Record<number, UserList>)
  }, [myLists, favoriteLists])
  const myListsGootSum = useMemo(() => myLists.reduce((acc, l) => acc + (l.goot_count || 0), 0), [myLists])
  const homeListId = useMemo(() => (myLists.find(l => l.name === 'Home')?.id), [myLists])

  const openShare = () => {
    if (!me) return
    const defaultId = homeListId ?? ''
    setShareListId(defaultId)
    const url = typeof defaultId === 'number'
      ? `${window.location.origin}/users/${encodeURIComponent(me.username)}/lists/${defaultId}`
      : `${window.location.origin}/users/${encodeURIComponent(me.username)}/works`
    setShareUrl(url)
    setShowShare(true)
  }

  useEffect(() => {
    if (!showShare) return
    if (!me) return
    if (shareListId === '') {
      if (typeof homeListId === 'number') {
        setShareUrl(`${window.location.origin}/users/${encodeURIComponent(me.username)}/lists/${homeListId}`)
      } else {
        setShareUrl(`${window.location.origin}/users/${encodeURIComponent(me.username)}/works`)
      }
    } else {
      const list = listIdToList[Number(shareListId)]
      const owner = (list?.owner_username) || me.username
      setShareUrl(`${window.location.origin}/users/${encodeURIComponent(owner)}/lists/${Number(shareListId)}`)
    }
  }, [shareListId, listIdToList, me, showShare, homeListId])

  async function loadLists(currentMe: { username: string } | null) {
    const reqAll = fetchPosts()
    const reqMy = currentMe ? fetchPosts({ username: currentMe.username }) : Promise.resolve({ data: [] as UserPost[] } as any)
    const reqContents = fetchContents()
    const reqMyLists = currentMe ? fetchMyLists() : Promise.resolve({ data: [] as UserList[] } as any)
    const reqFavLists = currentMe ? fetchFavoriteLists() : Promise.resolve({ data: [] as UserList[] } as any)
    const [pAll, pMy, c, l, fl] = await Promise.all([reqAll, reqMy, reqContents, reqMyLists, reqFavLists])
    setAllPosts(pAll.data)
    setMyPosts((pMy as any).data ?? [])
    setContents(c.data)
    setMyLists((l as any).data ?? [])
    setFavoriteLists((fl as any).data ?? [])
    // お気に入りリストの投稿も取得
    try {
      const favIds: number[] = (((fl as any).data ?? []) as UserList[]).map(x => x.id)
      if (favIds.length > 0) {
        const resArr = await Promise.all(favIds.map(id => fetchPosts({ list_id: id })))
        const mergedFavPosts = resArr.flatMap(r => r.data ?? [])
        setFavListPosts(mergedFavPosts)
      } else {
        setFavListPosts([])
      }
    } catch {
      setFavListPosts([])
    }
    // default selected list is empty (Home on server)
    setSelectedListId('')
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

  const doCreatePost = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)
    setLastCreated(null)
    try {
      const payload = {
        description: form.description,
        content_url: form.content_url,
        content_type: contentType,
        list_id: selectedListId === '' ? undefined : Number(selectedListId),
      }
      const res = await createPost(payload)
      const created = (res.data && res.data.data) ? res.data.data as UserPost : null
      if (created) setLastCreated(created)
      await loadLists(me)
      setForm({ description: '', content_url: '' })
      setShowConfirm(false)
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, '投稿に失敗しました'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirm(true)
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
            username={p.user?.username || 'anonymous'}
            createdAt={p.created_at}
            contentUrl={p.content_url}
            image={c?.image}
            title={c?.title || p.content_url}
            description={p.description}
            contentType={c?.content_type}
            goodCount={c?.good_count}
            postId={p.id}
            onDeleted={async () => { await loadLists(me) }}
            onUpdated={async () => { await loadLists(me) }}
          />
        )
      })}
    </div>
  )

  const renderGroupedByList = (posts: UserPost[]) => {
    const groups = new Map<number | 'unknown', UserPost[]>()
    posts.forEach(p => {
      const key = (p as any).list_id ?? 'unknown'
      const arr = groups.get(key) || []
      arr.push(p)
      groups.set(key, arr)
    })
    // 並び順: 自分のリスト順（myListsの順）→ unknown
    const orderedKeysSet = new Set<number | 'unknown'>([...myLists.map(l => l.id), ...favoriteLists.map(l => l.id)])
    const orderedKeys: Array<number | 'unknown'> = Array.from(orderedKeysSet)
    if (groups.has('unknown')) orderedKeys.push('unknown')

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {orderedKeys.filter(k => groups.has(k)).map(key => {
          const items = groups.get(key) || []
          const list = typeof key === 'number' ? listIdToList[key] : undefined
          const listName = list?.name ?? (typeof key === 'number' ? `リスト #${key}` : '未分類')
          const ownerName = (list?.owner_username || me?.username) ?? ''
          const keyStr = String(key)
          const expanded = expandedGroups[keyStr] ?? true
          return (
            <section key={String(key)} className="card shadow-sm" style={{ borderRadius: 12 }}>
              <div
                className="card-body"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', cursor: 'pointer' }}
                onClick={() => setExpandedGroups(v => ({ ...v, [keyStr]: !(v[keyStr] ?? true) }))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!list?.is_public && list && <i className="bi bi-lock-fill" title="非公開" style={{ color: 'var(--bs-secondary-color)' }} />}
                  <a
                    href={`/users/${encodeURIComponent(ownerName)}/lists/${typeof key === 'number' ? key : ''}`}
                    style={{ fontWeight: 600 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {listName}
                  </a>
                  {list?.owner_username && me?.username && list.owner_username !== me.username && (
                    <span style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>作成: {list.owner_username}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                  {list?.owner_username && me?.username && list.owner_username === me.username ? (
                    <button
                      type="button"
                      title="編集"
                      onClick={(e) => { e.stopPropagation(); setOpenListMenuKey(v => v === keyStr ? null : keyStr) }}
                      style={{
                        color: 'var(--bs-secondary-color)',
                        padding: 4,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 6,
                      }}
                      aria-label="メニュー"
                    >
                      <i className="bi bi-three-dots" />
                    </button>
                  ) : null}
                  {openListMenuKey === keyStr && (
                    <div
                      role="menu"
                      style={{
                        position: 'absolute', right: 36, top: '100%', marginTop: 6, minWidth: 180, zIndex: 10,
                        background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)', borderRadius: 8,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        onClick={() => { setRenameState({ open: true, id: key as number, name: listName }); setOpenListMenuKey(null) }}
                      >名前を変更</button>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', gap: 12 }}>
                        <div className="form-check form-switch" title="公開設定">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`menu-list-public-${key}`}
                            checked={!!list?.is_public}
                            disabled={updatingListId === (key as number)}
                            onChange={async (e) => {
                              try {
                                setUpdatingListId(key as number)
                                await toggleListPublic((key as number), e.target.checked)
                                await loadLists(me)
                                setSuccessPop('公開設定を更新しました')
                                setTimeout(() => setSuccessPop(null), 2000)
                              } catch (err: any) {
                                alert(getErrorMessage(err, '公開設定の更新に失敗しました'))
                              } finally {
                                setUpdatingListId(null)
                              }
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--bs-secondary-color)' }}>{list?.is_public ? '公開' : '非公開'}</span>
                      </div>
                      <button
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--bs-danger)', cursor: 'pointer', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}
                        onClick={() => { setDeleteState({ open: true, id: key as number, name: listName, loading: false }); setOpenListMenuKey(null) }}
                      >削除</button>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    title={expanded ? '折りたたむ' : '展開する'}
                    onClick={(e) => { e.stopPropagation(); setExpandedGroups(v => ({ ...v, [keyStr]: !(v[keyStr] ?? true) })) }}
                  >
                    <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                  </button>
                </div>
              </div>
              <div
                className="home-card-grid"
                style={{
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  padding: '0 10px 10px',
                  display: expanded ? 'grid' : 'none'
                }}
              >
                {items.map(p => {
                  const c = urlToContent[p.content_url]
                  return (
                    <ContentCard
                      key={p.id}
                      username={p.user?.username || 'anonymous'}
                      createdAt={p.created_at}
                      contentUrl={p.content_url}
                      image={c?.image}
                      title={c?.title || p.content_url}
                      description={p.description}
                      contentType={c?.content_type}
                      goodCount={c?.good_count}
                      postId={p.id}
                      onDeleted={async () => { await loadLists(me) }}
                      onUpdated={async () => { await loadLists(me) }}
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

  // posts filter: all / mine / others
  const combinedPosts = useMemo(() => [...myPosts, ...favListPosts], [myPosts, favListPosts])
  const filteredCombinedPosts = useMemo(() => {
    if (!me) return combinedPosts
    if (userFilter === 'mine') return combinedPosts.filter(p => p.user?.username === me.username)
    if (userFilter === 'others') return combinedPosts.filter(p => p.user?.username !== me.username)
    return combinedPosts
  }, [combinedPosts, userFilter, me])
  const displayedPosts = useMemo(() => filteredCombinedPosts.slice(0, visibleCount), [filteredCombinedPosts, visibleCount])

  const renderMyList = (posts: UserPost[]) => (
    <div className="card shadow-sm" style={{ borderRadius: 12 }}>
      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 }}>
        <h5 className="card-title" style={{ margin: 0 }}>あなたの登録した作品</h5>
        <button className="btn btn-outline-secondary btn-sm" onClick={openShare}>
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
      {showUpdatePop && (
        <div className="alert alert-info" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            新しいアップデートがあります。<a href="/update_info" className="alert-link">こちら</a> から詳細をご確認ください。
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => { try { localStorage.setItem('update_pop_hidden_2025-10-21', '1') } catch {}; setShowUpdatePop(false) }}
          >非表示</button>
        </div>
      )}
      {props.bannerMessage && (
        <div className="alert alert-info" role="alert" style={{ marginBottom: 12 }}>
          {props.bannerMessage}
        </div>
      )}
      <div className="card shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{me ? me.username : 'ゲスト'}</div>
              {me && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--bs-secondary-color)', fontSize: 12, marginTop: 2 }}>
                  <span>登録 {myPosts.length}</span>
                  <span><i className="bi bi-heart-fill" /> {myListsGootSum}</span>
                </div>
              )}
            </div>
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
            {me && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="form-select" value={selectedListId} onChange={e => setSelectedListId(e.target.value === '' ? '' : Number(e.target.value))}>
                  <option value="">Home に投稿</option>
                  {myLists.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setShowCreateList(true)}>＋</button>
              </div>
            )}
            <textarea className="form-control" rows={5} placeholder="本文,感想など(任意)" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={openShare}
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
          <ul className="nav nav-tabs mb-3" style={{ display: 'flex', alignItems: 'center' }}>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>投稿一覧</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>登録作品</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'lists' ? 'active' : ''}`} onClick={() => setActiveTab('lists')}>リスト</button>
            </li>
          </ul>
          {activeTab === 'posts' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button type="button" className={`btn btn-sm ${userFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setUserFilter('all')}>すべて</button>
                <button type="button" className={`btn btn-sm ${userFilter === 'mine' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setUserFilter('mine')}>自分</button>
                <button type="button" className={`btn btn-sm ${userFilter === 'others' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setUserFilter('others')}>他ユーザー</button>
              </div>
              {renderGroupedByList(displayedPosts)}
              {filteredCombinedPosts.length > visibleCount && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setVisibleCount(c => c + 40)}
                  >もっと見る</button>
                </div>
              )}
            </>
          ) : activeTab === 'profile' ? (
            renderMyList(myPosts)
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h5 className="card-title" style={{ margin: 0 }}>あなたのリスト</h5>
                <button className="btn btn-outline-primary btn-sm" onClick={() => setShowCreateList(true)}>+ 新しいリスト</button>
              </div>
              <ul className="list-group">
                {myLists.map(l => (
                  <li key={l.id} className="list-group-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {!l.is_public && <i className="bi bi-lock-fill" title="非公開" style={{ color: 'var(--bs-secondary-color)' }} />}
                        <a href={`/users/${encodeURIComponent(me!.username)}/lists/${l.id}`} style={{ fontWeight: 600 }}>{l.name}</a>
                      </div>
                      {l.description && <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>{l.description}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="form-check form-switch" title="公開設定">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`list-public-${l.id}`}
                          checked={l.is_public}
                          disabled={updatingListId === l.id}
                          onChange={async (e) => {
                            try {
                              setUpdatingListId(l.id)
                              const res = await updateList(l.id, { is_public: e.target.checked })
                              setMyLists(prev => prev.map(x => x.id === l.id ? { ...x, is_public: res.data.is_public } : x))
                            } catch (e: any) {
                              alert(getErrorMessage(e, '公開設定の更新に失敗しました'))
                            } finally {
                              setUpdatingListId(null)
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor={`list-public-${l.id}`}></label>
                      </div>
                      {/* いいね数の表示は非表示に変更 */}
                    </div>
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 8px' }}>
                <h5 className="card-title" style={{ margin: 0 }}>お気に入りに登録したリスト</h5>
              </div>
              <ul className="list-group">
                {favoriteLists.length === 0 && (
                  <li className="list-group-item" style={{ color: 'var(--bs-secondary-color)' }}>まだお気に入りはありません</li>
                )}
                {favoriteLists.map(l => (
                  <li key={l.id} className="list-group-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {!l.is_public && <i className="bi bi-lock-fill" title="非公開" style={{ color: 'var(--bs-secondary-color)' }} />}
                        <a href={`/users/${encodeURIComponent(l.owner_username || '')}/lists/${l.id}`} style={{ fontWeight: 600 }}>{l.name}</a>
                      </div>
                      <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>作成: {l.owner_username}</div>
                      {l.description && <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>{l.description}</div>}
                    </div>
                  {/* いいね数の表示は非表示に変更 */}
                  </li>
                ))}
              </ul>
            </div>
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
                {me && (
                  <>
                    <label className="form-label">共有対象</label>
                    <select
                      className="form-select"
                      value={shareListId}
                      onChange={e => setShareListId(e.target.value === '' ? '' : Number(e.target.value))}
                    >
                      <option value="">Home（あなたの登録作品一覧）</option>
                      {myLists.length > 0 && (
                        <optgroup label="あなたのリスト">
                          {myLists.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {favoriteLists.length > 0 && (
                        <optgroup label="お気に入りリスト">
                          {favoriteLists.map(l => (
                            <option key={l.id} value={l.id}>{l.name}（{l.owner_username}）</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </>
                )}
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

      {renameState.open && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">リスト名の変更</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setRenameState({ open: false, id: null, name: '' })}></button>
              </div>
              <div className="modal-body" style={{ display: 'grid', gap: 8 }}>
                <label className="form-label">新しい名前</label>
                <input className="form-control" value={renameState.name} onChange={e => setRenameState(s => ({ ...s, name: e.target.value }))} maxLength={255} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRenameState({ open: false, id: null, name: '' })}>キャンセル</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!renameState.id || !renameState.name.trim()}
                  onClick={async () => {
                    try {
                      if (!renameState.id) return
                      await renameList(renameState.id, renameState.name.trim())
                      setRenameState({ open: false, id: null, name: '' })
                      await loadLists(me)
                      setSuccessPop('リスト名を変更しました')
                      setTimeout(() => setSuccessPop(null), 2000)
                    } catch (e: any) {
                      alert(getErrorMessage(e, '名前の変更に失敗しました'))
                    }
                  }}
                >変更</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteState.open && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">リストを削除</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setDeleteState({ open: false, id: null, name: '', loading: false })}></button>
              </div>
              <div className="modal-body">
                <p style={{ margin: 0 }}>「{deleteState.name}」を削除します。登録された作品も削除されます。この操作は取り消せません。</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteState({ open: false, id: null, name: '', loading: false })}>キャンセル</button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={deleteState.loading || !deleteState.id}
                  onClick={async () => {
                    try {
                      if (!deleteState.id) return
                      setDeleteState(s => ({ ...s, loading: true }))
                      await deleteList(deleteState.id)
                      setDeleteState({ open: false, id: null, name: '', loading: false })
                      await loadLists(me)
                      setSuccessPop('リストを削除しました')
                      setTimeout(() => setSuccessPop(null), 2000)
                    } catch (e: any) {
                      alert(getErrorMessage(e, 'リストの削除に失敗しました'))
                      setDeleteState(s => ({ ...s, loading: false }))
                    }
                  }}
                >削除</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {successPop && (
        <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1060 }}>
          <div className="alert alert-success" role="alert" style={{ marginBottom: 0 }}>
            {successPop}
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">投稿内容の確認</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowConfirm(false)}></button>
              </div>
              <div className="modal-body" style={{ display: 'grid', gap: 8 }}>
                <div>
                  <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>URL</div>
                  <div style={{ wordBreak: 'break-word' }}>{form.content_url || '-'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>種別</div>
                  <div>{contentType || '-'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>投稿先</div>
                  <div>{selectedListId === '' ? 'Home' : (listIdToList[Number(selectedListId)]?.name || `リスト #${selectedListId}`)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>本文</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{form.description || '(なし)'}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirm(false)}>戻る</button>
                <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={doCreatePost}>{isSubmitting ? '投稿中...' : 'この内容で投稿'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateList && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">新しいリストを作成</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCreateList(false)}></button>
              </div>
              <div className="modal-body" style={{ display: 'grid', gap: 8 }}>
                <label className="form-label">名前</label>
                <input className="form-control" value={newList.name} onChange={e => setNewList(v => ({ ...v, name: e.target.value }))} maxLength={255} />
                <label className="form-label">説明（任意）</label>
                <textarea className="form-control" rows={3} value={newList.description} onChange={e => setNewList(v => ({ ...v, description: e.target.value }))} />
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="list-public" checked={newList.is_public} onChange={e => setNewList(v => ({ ...v, is_public: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="list-public">公開</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateList(false)}>キャンセル</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      if (!newList.name.trim()) { alert('名前を入力してください'); return }
                      const res = await createList({ name: newList.name.trim(), description: newList.description.trim() || undefined, is_public: newList.is_public })
                      setShowCreateList(false)
                      setNewList({ name: '', description: '', is_public: true })
                      await loadLists(me)
                      // 新規作成したリストを選択状態に
                      if ((res as any).data?.id) setSelectedListId((res as any).data.id)
                    } catch (e: any) {
                      alert(getErrorMessage(e, 'リストの作成に失敗しました'))
                    }
                  }}
                >作成</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}