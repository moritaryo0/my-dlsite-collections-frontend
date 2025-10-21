import ContentRanking from '../components/ContentRanking'
import PublicUsersList from '../components/PublicUsersList'

export default function Search() {
  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 className="mb-3">探す</h2>
      <div className="mb-3">
        <ContentRanking />
      </div>
      <div className="mb-3">
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>ユーザーの投稿</h3>
        <PublicUsersList />
      </div>
    </div>
  )
}
