import AboutSection from '../components/AboutSection'

export default function About() {
  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 className="mb-3">このサイトについて</h2>
      <AboutSection />
      <div className="mt-4" style={{ marginTop: 16 }}>
        <a className="btn btn-primary" href="/age-quiz">
          あなたは本当に18歳以上ですか？
        </a>
      </div>
    </div>
  )
}
