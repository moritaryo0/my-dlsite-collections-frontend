import { useEffect, useMemo, useState } from 'react'
import { fetchContents } from '../lib/api'
import type { ContentData } from '../lib/api'

type FilterType = 'all' | 'ボイス・ASMR' | '漫画・CG作品' | 'ゲーム'
type SortKey = 'good' | 'recent' | 'title'

export default function ContentRanking() {
  const [contents, setContents] = useState<ContentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(10)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortKey, setSortKey] = useState<SortKey>('good')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetchContents()
        setContents(res.data ?? [])
      } catch (e: any) {
        setError(e?.message || '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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

  const filtered = useMemo(() => {
    const items = filter === 'all' ? contents : contents.filter(c => c.content_type === filter)
    return items
  }, [contents, filter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortKey === 'good') {
      arr.sort((a, b) => (b.good_count ?? 0) - (a.good_count ?? 0))
    } else if (sortKey === 'recent') {
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortKey === 'title') {
      arr.sort((a, b) => (a.title || a.content_url).localeCompare(b.title || b.content_url))
    }
    return arr
  }, [filtered, sortKey])

  // Competition ranking numbers with ties: 1,1,3,4...
  const rankNumbers = useMemo(() => {
    let lastCount: number | null = null
    let lastRank = 0
    const ranks: number[] = []
    for (let i = 0; i < sorted.length; i++) {
      const cnt = sorted[i].good_count ?? 0
      if (i === 0) {
        lastRank = 1
        lastCount = cnt
        ranks.push(1)
        continue
      }
      if (cnt === lastCount) {
        ranks.push(lastRank)
      } else {
        lastRank = i + 1
        lastCount = cnt
        ranks.push(lastRank)
      }
    }
    return ranks
  }, [sorted])

  const visibleIndices = useMemo(() => Array.from({ length: Math.min(displayCount, sorted.length) }, (_, i) => i), [sorted.length, displayCount])

  return (
    <div className="card shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
      <div className="card-body" style={{ paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <h5 className="card-title" style={{ margin: 0 }}>コンテンツランキング</h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { key: 'all', label: '全て' },
                { key: 'ボイス・ASMR', label: 'ボイス・ASMR' },
                { key: '漫画・CG作品', label: '漫画・CG作品' },
                { key: 'ゲーム', label: 'ゲーム' },
              ] as { key: FilterType; label: string }[]).map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className="btn btn-sm"
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: filter === f.key ? '2px solid #8ab4ff' : '1px solid var(--bs-border-color)',
                    background: 'transparent',
                    color: 'var(--bs-body-color)'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <select className="form-select form-select-sm" style={{ width: 140, minWidth: 120 }} value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}>
              <option value="good">登録数順</option>
              <option value="recent">新着順</option>
              <option value="title">タイトル順</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="px-3 pb-3">読み込み中...</div>}
      {error && <div className="alert alert-danger m-3" role="alert">{error}</div>}

      <ul className="list-group list-group-flush" style={{ margin: 0 }}>
        {visibleIndices.map((idx) => {
          const c = sorted[idx]
          const rank = rankNumbers[idx]
          return (
          <li
            key={c.id ?? `${c.content_url}-${idx}`}
            className="list-group-item p-2"
            style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', padding: '8px 10px' }}
          >
            <span className="badge text-bg-dark" style={{ width: 28, justifyContent: 'center', display: 'inline-flex' }}>{rank}</span>
            {c.image && (
              <a href={c.content_url} target="_blank" rel="noreferrer" style={{ flex: '0 0 auto' }}>
                <img src={c.image} alt={c.title || 'preview'} loading="lazy" decoding="async" style={{ width: 56, height: 'auto', display: 'block' }} />
              </a>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <a
                href={c.content_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontWeight: 600,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as any,
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}
              >
                {c.title || c.content_url}
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {c.content_type && (
                  <span className="badge" style={getContentTypeBadgeStyle(c.content_type)}>{c.content_type}</span>
                )}
                <span style={{ color: 'var(--bs-secondary-color)', fontSize: 12 }}>登録数 {c.good_count ?? 0}</span>
              </div>
            </div>
          </li>
          )
        })}
        {(!loading && !error && visibleIndices.length === 0) && (
          <li className="list-group-item" style={{ color: 'var(--bs-secondary-color)' }}>該当するコンテンツがありません</li>
        )}
      </ul>

      {sorted.length > displayCount && !loading && !error && (
        <div className="p-3" style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setDisplayCount(c => c + 10)}>
            もっと表示する
          </button>
        </div>
      )}
    </div>
  )
}


