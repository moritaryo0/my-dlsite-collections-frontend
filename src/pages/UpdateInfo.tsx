export default function UpdateInfo() {
  return (
    <div style={{ width: '100%', padding: '20px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 className="mb-3">アップデート情報</h2>
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>10月21日 アップデート</h3>
          <ul style={{ marginBottom: 0 }}>
            <li>ツイッター（X）のアカウントを使ったログイン機能を追加</li>
            <li>「探す」にユーザーの投稿一覧を追加</li>
            <li>
              アカウントの公開/非公開を設定可能に（非公開にしてもリスト共有機能は利用できます。非公開は「探す」の掲載のみ停止します）
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}


