import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Search from './pages/Search'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { PostFormProvider } from './context/PostFormContext'
import MobileNav from './components/MobileNav'
import MobileHeader from './components/MobileHeader'
import { AuthProvider } from './context/AuthContext'
import Profile from './pages/Profile.tsx'
import UserProfile from './pages/UserProfile'
import UserWorks from './pages/UserWorks'
import About from './pages/About'
import RequireAuth from './components/RequireAuth'
import AgeQuiz from './pages/AgeQuiz'
import XSignup from './pages/XSignup'
import UpdateInfo from './pages/UpdateInfo'

export default function App() {
  const [showAgeModal, setShowAgeModal] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem('age_confirmed')
      if (!v) setShowAgeModal(true)
    } catch {
      setShowAgeModal(true)
    }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <PostFormProvider>
          <div>
            <MobileHeader />
            <div className="layout-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '100vh', width: '100%' }}>
              <div className="sidebar-desktop" style={{ display: 'block' }}>
                <Sidebar />
              </div>
              <main style={{ minHeight: '100vh', paddingBottom: 72 }}>
                <Routes>
                  <Route path="/" element={<RequireAuth redirectToSignup><Home /></RequireAuth>} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/users/:username" element={<RequireAuth><UserProfile /></RequireAuth>} />
                  {/* 例外: 未ログインでも閲覧可 */}
                  <Route path="/users/:username/works" element={<UserWorks />} />
                  {/* 公開ページ */}
                  <Route path="/age-quiz" element={<AgeQuiz />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/update_info" element={<UpdateInfo />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/x-signup" element={<XSignup />} />
                </Routes>
              </main>
            </div>
            <div className="mobile-only">
              <MobileNav />
            </div>
          </div>
          {showAgeModal && (typeof window === 'undefined' || window.location.pathname !== '/age-quiz') && (
            <div className="modal fade show age-modal-backdrop" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">年齢確認</h5>
                  </div>
                  <div className="modal-body" style={{ lineHeight: 1.7 }}>
                    このサイトには成人向けの内容が含まれる場合があります。18歳以上ですか？
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { try { window.location.href = '/age-quiz' } catch {} }}
                    >いいえ</button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => { try { localStorage.setItem('age_confirmed', '1') } catch {}; setShowAgeModal(false) }}
                    >はい（18歳以上）</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PostFormProvider>
      </AuthProvider>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-only { display: block !important; }
          .layout-grid { grid-template-columns: 1fr !important; }
          .home-card-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
          .profile-card-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .home-card-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
          .profile-card-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
        }
        .age-modal-backdrop { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
      `}</style>
    </BrowserRouter>
  )
}
