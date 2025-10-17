export function AboutSection() {
  return (
    <div className="card shadow-sm" style={{ borderRadius: 12 }}>
      <div className="card-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
このサイトは主にdlsiteで販売されている作品の中で特に気に入った作品を記録し、Twitterやdiscordで共有することを目的とするサービスです。
<br />あなたも好きな作品をリストにまとめてTwitterで性癖をツイートして、あなたのお気に入り作品をまだ知らない人たちに広めましょう。
<br />大丈夫です。どうせ日頃から、先生俺死にたいんすよとか言いながらしょっちゅうツイートしてるのをまとめるような作業です。
<br />サークル運営の方は過去作のリストを簡単にまとめることができます。

      </div>
      <div className="card-footer">
        <a className="btn btn-outline-primary" href="https://twitter.com/aokikyuran">
            わたしのTwitter
        </a>
      </div>
    </div>
  )
}

export default AboutSection


