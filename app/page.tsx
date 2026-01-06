import Link from 'next/link'
import ConceptualCycle from '@/app/components/landing/ConceptualCycle'

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--landing-bg, oklch(0.98 0.01 85))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 2rem)',
      }}
      role="main"
      aria-label="Página inicial do Pachai"
    >
      {/* Seção Hero - Conceitual */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '700px',
          width: '100%',
          marginBottom: 'clamp(4rem, 8vw, 6rem)',
        }}
        aria-labelledby="hero-title"
      >
        {/* Elemento gráfico conceitual */}
        <div
          style={{
            marginBottom: '3rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ConceptualCycle />
        </div>

        {/* Nome Pachai */}
        <h1
          id="hero-title"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 400,
            fontFamily: 'Georgia, "Times New Roman", serif',
            marginBottom: '2rem',
            textAlign: 'center',
            color: 'var(--landing-text, oklch(0.25 0.03 45))',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Pachai
        </h1>

        {/* Tagline breve */}
        <p
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
            lineHeight: 1.7,
            marginBottom: '4rem',
            textAlign: 'center',
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            maxWidth: '580px',
            fontWeight: 300,
          }}
        >
          Um espaço de continuidade para o pensamento sobre produto.
        </p>
      </section>

      {/* Seção Posicionamento */}
      <section
        style={{
          maxWidth: '600px',
          width: '100%',
          marginBottom: 'clamp(4rem, 8vw, 6rem)',
        }}
        aria-label="Sobre o Pachai"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
          }}
        >
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.85,
              textAlign: 'center',
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            Diferente de um chat que responde rápido, o Pachai escuta com continuidade.
            Preserva o que foi pensado antes, respeita o tempo necessário para clareza
            e mantém o contexto vivo entre uma conversa e outra.
          </p>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.85,
              textAlign: 'center',
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            Não há pressa. Não há conclusões precipitadas. Apenas um espaço seguro
            para nomear a dor, explorar o valor desejado e chegar a entendimentos
            conscientes, no seu tempo.
          </p>
        </div>
      </section>

      {/* Call to Action - Sutil */}
      <section
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '2rem',
        }}
      >
        <Link
          href="/login"
          className="landing-button"
          style={{
            padding: '0.875rem 2.5rem',
            background: 'var(--landing-button-bg, oklch(0.30 0.04 50))',
            color: 'var(--landing-button-text, oklch(0.95 0.01 85))',
            borderRadius: '0.375rem',
            fontSize: '0.9375rem',
            fontWeight: 400,
            display: 'inline-block',
            textDecoration: 'none',
            border: '1px solid var(--landing-border, oklch(0.90 0.01 80))',
          }}
          aria-label="Entrar no Pachai"
        >
          Entrar
        </Link>
      </section>
    </main>
  )
}

