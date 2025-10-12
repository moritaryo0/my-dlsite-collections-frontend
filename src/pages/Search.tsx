import ContentRanking from '../components/ContentRanking'

export default function Search() {

  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 className="mb-3">探す</h2>
      <div className="mb-3">
        <ContentRanking />
      </div>
    </div>
  )
}
