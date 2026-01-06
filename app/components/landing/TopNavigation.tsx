'use client'

import Link from 'next/link'

export default function TopNavigation() {
  return (
    <header
      className="landing-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(6px)',
      }}
      role="banner"
      aria-label="Cabeçalho principal"
    >
      {/* Logo */}
      <span
        className="logo"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '1.25rem',
          fontWeight: 400,
          color: 'var(--landing-text, oklch(0.25 0.03 45))',
          letterSpacing: '-0.01em',
        }}
      >
        Pachai
      </span>

      {/* Link Acessar */}
      <Link
        href="/login"
        className="cta"
        style={{
          fontSize: '0.9375rem',
          fontWeight: 400,
          color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
          textDecoration: 'none',
          transition: 'opacity 0.2s ease',
        }}
        aria-label="Acessar o Pachai"
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.7'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        Acessar
      </Link>
    </header>
  )
}
