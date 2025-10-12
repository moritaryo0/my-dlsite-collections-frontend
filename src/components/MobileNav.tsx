import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MobileNav() {
  const { me } = useAuth()
  const itemStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'var(--bs-body-color)', fontSize: 12 }
  const barStyle: React.CSSProperties = {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    display: 'grid', gridTemplateColumns: me ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)',
    borderTop: '1px solid var(--bs-border-color)', background: 'var(--bs-body-bg)', padding: '6px 8px'
  }
  return (
    <div className="mobile-nav" style={barStyle}>
      <NavLink to="/" style={itemStyle}><i className="bi bi-house-door" /><span>ホーム</span></NavLink>
      <NavLink to="/search" style={itemStyle}><i className="bi bi-search" /><span>探す</span></NavLink>
      <NavLink to="/settings" style={itemStyle}><i className="bi bi-gear" /><span>設定</span></NavLink>
      <NavLink to="/about" style={itemStyle}><i className="bi bi-info-circle" /><span>このサイト</span></NavLink>
      {!me && (
        <NavLink to="/login" style={itemStyle}><i className="bi bi-box-arrow-in-right" /><span>ログイン</span></NavLink>
      )}
    </div>
  )
}
