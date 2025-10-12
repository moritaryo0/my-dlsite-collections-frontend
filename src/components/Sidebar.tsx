import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { me } = useAuth()
  const linkStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', borderRadius: 8, color: 'var(--bs-body-color)', textDecoration: 'none'
  }
  const activeStyle: React.CSSProperties = {
    background: 'var(--bs-secondary-bg)',
  }
  return (
    <aside style={{ width: 200, padding: 12, borderRight: '1px solid var(--bs-border-color)', position: 'sticky', top: 0, height: '100vh' }}>
      <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18, textDecoration: 'none', color: 'var(--bs-body-color)', marginBottom: 12 }}>
        <i className="bi bi-graph-up" />
        <span>同人メーター</span>
      </NavLink>
      <nav style={{ display: 'grid', gap: 6 }}>
        <NavLink to="/" end style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
          <i className="bi bi-house-door" /> ホーム
        </NavLink>
        <NavLink to="/search" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
          <i className="bi bi-search" /> 探す
        </NavLink>
        <NavLink to="/settings" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
          <i className="bi bi-gear" /> 設定
        </NavLink>
        <NavLink to="/about" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
          <i className="bi bi-info-circle" /> このサイト
        </NavLink>
        <hr />
        {!me && (
          <NavLink to="/login" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
            <i className="bi bi-box-arrow-in-right" /> ログイン
          </NavLink>
        )}
      </nav>
    </aside>
  )
}
