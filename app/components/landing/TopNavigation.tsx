import Link from 'next/link'

export default function TopNavigation() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'var(--landing-bg, oklch(0.98 0.01 85))',
        borderBottom: '1px solid var(--landing-border, oklch(0.90 0.01 80))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(1.5rem, 4vw, 2rem)',
        zIndex: 100,
      }}
      role="navigation"
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '1.25rem',
          fontWeight: 400,
          color: 'var(--landing-text, oklch(0.25 0.03 45))',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}
        aria-label="Pachai - Página inicial"
      >
        Pachai
      </Link>

      {/* Link Entrar */}
      <Link
        href="/login"
        style={{
          fontSize: '0.9375rem',
          fontWeight: 400,
          color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
          textDecoration: 'none',
          transition: 'opacity 0.2s ease',
        }}
        aria-label="Entrar no Pachai"
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.7'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        Entrar
      </Link>
    </nav>
  )
}
