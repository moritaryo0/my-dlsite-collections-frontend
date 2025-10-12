import React from 'react'

export default function MobileHeader() {
  return (
    <header
      className="mobile-only"
      style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: 'var(--bs-body-bg)',
        borderBottom: '1px solid var(--bs-border-color)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-graph-up" />
          <div style={{ fontWeight: 800, fontSize: 16 }}>同人メーター</div>
        </div>
      </div>
    </header>
  )
}


