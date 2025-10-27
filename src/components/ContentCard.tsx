import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { deletePost, fetchMyLists, movePostList, type UserList } from '../lib/api'

type Props = {
  username?: string
  createdAt?: string | number | Date
  contentUrl: string
  image?: string
  title?: string
  description?: string
  contentType?: string
  goodCount?: number
  postId?: number
  onDeleted?: (id: number) => void
  onUpdated?: () => void
}

export default function ContentCard({ username, createdAt, contentUrl, image, title, description, contentType, goodCount, postId, onDeleted, onUpdated }: Props) {
  const [showDetail, setShowDetail] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showMove, setShowMove] = useState(false)
  const [lists, setLists] = useState<UserList[]>([])
  const [targetListId, setTargetListId] = useState<number | ''>('')
  const { me } = useAuth()
  const createdText = createdAt ? new Date(createdAt).toLocaleString() : ''

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

  const canDelete = !!postId && !!me && username && me.username === username
  const canEdit = canDelete

  const menuRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (menuRef.current.contains(e.target as Node)) return
      setShowMenu(false)
    }
    if (showMenu) document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [showMenu])

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!postId) return
    if (!window.confirm('この投稿を削除しますか？')) return
    try {
      setDeleting(true)
      await deletePost(postId)
      setShowMenu(false)
      if (onDeleted) onDeleted(postId)
    } catch (err: any) {
      alert(err?.response?.data?.error || '削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }
  return (
    <article
      data-created-at={createdText}
      onClick={() => { if (description) setShowDetail(true) }}
      style={{
      border: '1px solid var(--bs-border-color)', borderRadius: 10, overflow: 'hidden',
      background: 'var(--bs-body-bg)', display: 'flex', flexDirection: 'column', height: '100%'
    }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && description) { e.preventDefault(); setShowDetail(true) } }}
    >
      {username && (
        <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={`/users/${encodeURIComponent(username)}`} className="link-primary" style={{ fontSize: 14, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>@{username}</a>
          </div>
          {canDelete && (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                style={{
                  color: 'var(--bs-secondary-color)',
                  padding: 6,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 6,
                }}
                aria-label="メニュー"
                title="メニュー"
                onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v) }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, display: 'inline-block' }}>⋮</span>
              </button>
              {showMenu && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 6, minWidth: 140, zIndex: 10,
                    background: 'var(--bs-body-bg)',
                    border: 'none',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {canEdit && (
                    <button
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}
                      onClick={async () => {
                        try { const res = await fetchMyLists(); setLists((res as any).data || []); } catch {}
                        setTargetListId('')
                        setShowMove(true)
                        setShowMenu(false)
                      }}
                    >リストを変更</button>
                  )}
                  <button
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 12px', background: 'transparent', border: 'none',
                      color: 'var(--bs-danger)', cursor: deleting ? 'not-allowed' : 'pointer', borderRadius: 8
                    }}
                    disabled={deleting}
                    onClick={handleDelete}
                  >{deleting ? '削除中…' : '削除'}</button>
                </div>
              )}
            </div>
          )}
        </header>
      )}

      {image && (
        <div style={{ width: '100%', background: 'var(--bs-tertiary-bg)', overflow: 'hidden' }}>
          <a href={contentUrl} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <img src={image} alt={title || 'preview'} loading="lazy" decoding="async" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </a>
        </div>
      )}

      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {contentType && (
            <span className="badge" style={getContentTypeBadgeStyle(contentType)}>{contentType}</span>
          )}
          {typeof goodCount === 'number' && (
            <span className="badge text-bg-dark">登録数 {goodCount}</span>
          )}
        </div>

        <div style={{ minHeight: 52, marginTop: 4 }}>
          {description ? (
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as any }}>{description}</p>
          ) : (
            <div style={{ height: 0 }} />
          )}
          <a href={contentUrl} target="_blank" rel="noreferrer" className="link-primary" style={{ fontSize: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }} onClick={(e) => e.stopPropagation()}>
            {title || contentUrl}
          </a>
        </div>
      </div>

      {showDetail && createPortal((
        <>
          <div
            className="modal fade show content-modal-backdrop"
            style={{
              position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)', zIndex: 1050
            }}
            onClick={() => setShowDetail(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-lg"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 960, margin: 0, padding: '0 12px' }}
            >
              <div className="modal-content content-modal-anim">
                <div className="modal-header">
                  <h5 className="modal-title">全文表示</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowDetail(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="content-modal-grid">
                    <div className="content-modal-left">
                      {image && (
                        <a href={contentUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                          <img src={image} alt={title || 'preview'} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </a>
                      )}
                      <a className="btn btn-outline-secondary mt-2" href={contentUrl} target="_blank" rel="noreferrer">作品リンクを開く</a>
                    </div>
                    <div className="content-modal-right" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {description || ''}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary" onClick={() => setShowDetail(false)}>閉じる</button>
                </div>
              </div>
            </div>
          </div>
          <style>{`
            .content-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
            @media (max-width: 768px) { .content-modal-grid { grid-template-columns: 1fr; } }

            @keyframes contentModalPop {
              from { transform: scale(0.98); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes contentBackdropFade {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .content-modal-anim { animation: contentModalPop 160ms ease-out; }
            .content-modal-backdrop { animation: contentBackdropFade 180ms ease-out; }
            @media (prefers-reduced-motion: reduce) {
              .content-modal-anim, .content-modal-backdrop { animation: none !important; }
            }
          `}</style>
        </>
      ), document.body)}

      {showMove && createPortal((
        <div
          className="modal fade show"
          style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={() => setShowMove(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">リストを変更</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowMove(false)}></button>
              </div>
              <div className="modal-body" style={{ display: 'grid', gap: 8 }}>
                <label className="form-label">変更先のリスト</label>
                <select className="form-select" value={targetListId} onChange={e => setTargetListId(e.target.value === '' ? '' : Number(e.target.value))}>
                  <option value="">選択してください</option>
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMove(false)}>キャンセル</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!postId || targetListId === ''}
                  onClick={async () => {
                    if (!postId || targetListId === '') return
                    try {
                      await movePostList(postId, Number(targetListId))
                      setShowMove(false)
                      if (onUpdated) onUpdated()
                    } catch (err: any) {
                      alert(err?.response?.data?.error || 'リスト変更に失敗しました')
                    }
                  }}
                >変更</button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </article>
  )
}


