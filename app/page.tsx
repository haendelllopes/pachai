import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      <h1 style={{
        fontSize: '3rem',
        fontWeight: 600,
        marginBottom: '1rem',
        textAlign: 'center',
      }}>
        Pachai
      </h1>
      
      <p style={{
        fontSize: '1.25rem',
        lineHeight: 1.6,
        marginBottom: '2rem',
        textAlign: 'center',
        color: '#666',
      }}>
        Um espaço de escuta contínua para decisões conscientes de produto.
      </p>
      
      <p style={{
        fontSize: '1rem',
        lineHeight: 1.8,
        marginBottom: '3rem',
        textAlign: 'center',
        color: '#888',
        maxWidth: '600px',
      }}>
        O Pachai preserva contexto, provoca clareza e mantém decisões vivas ao longo do tempo.
        Ele escuta, reflete e ajuda você a nomear a dor e o valor desejado.
      </p>
      
      <Link
        href="/login"
        style={{
          padding: '0.75rem 2rem',
          background: '#1a1a1a',
          color: '#ffffff',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: 500,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#333'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#1a1a1a'
        }}
      >
        Começar
      </Link>
    </main>
  )
}

