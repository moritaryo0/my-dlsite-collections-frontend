export default function XLoginButton({ className }: { className?: string }) {
  const backendBase = (import.meta as any).env?.VITE_BACKEND_BASE_URL ?? 'http://localhost:8000'
  const href = `${backendBase}/social/twitter_oauth2/login/`
  return (
    <a
      href={href}
      className={className ?? 'btn btn-dark'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
    >
      {/* X (Twitter) SVG */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M18.244 2H21.5l-7.52 8.59L23 22h-6.094l-4.78-6.21L6.58 22H3.32l8.06-9.2L1 2h6.25l4.31 5.67L18.244 2zm-1.07 18h1.78L7.92 4h-1.8l10.05 16z"/>
      </svg>
      <span>Xでログイン</span>
    </a>
  )
}
