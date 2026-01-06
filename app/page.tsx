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
        padding: 'clamp(4rem, 8vw, 6rem) clamp(1.5rem, 4vw, 2rem)',
      }}
      role="main"
      aria-label="Página inicial do Pachai"
    >
      {/* 1. HERO */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '700px',
          width: '100%',
          margin: '0 auto',
          marginBottom: 'clamp(4rem, 8vw, 6rem)',
        }}
        aria-labelledby="hero-headline"
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

        {/* Headline */}
        <h1
          id="hero-headline"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 400,
            fontFamily: 'Georgia, "Times New Roman", serif',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: 'var(--landing-text, oklch(0.25 0.03 45))',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            maxWidth: '600px',
          }}
        >
          Um espaço para pensar com clareza.
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
            lineHeight: 1.7,
            marginBottom: '3rem',
            textAlign: 'center',
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            maxWidth: '580px',
            fontWeight: 300,
          }}
        >
          Pachai ajuda você a amadurecer decisões complexas sem pressa, sem perder contexto e sem abrir mão da autoria.
        </p>

        {/* CTA Hero */}
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
          aria-label="Começar uma conversa no Pachai"
        >
          Começar uma conversa
        </Link>
      </section>

      {/* 2. BLOCO — O PROBLEMA REAL */}
      <section
        style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          marginBottom: 'clamp(4rem, 8vw, 6rem)',
        }}
        aria-label="O problema real"
      >
        <p
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
            lineHeight: 1.7,
            textAlign: 'center',
            color: 'var(--landing-text, oklch(0.25 0.03 45))',
            fontWeight: 400,
            marginBottom: '1.5rem',
          }}
        >
          Nem toda decisão precisa ser rápida.
          <br />
          Mas quase todas precisam ser bem pensadas.
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
          Ferramentas tradicionais priorizam respostas.
          <br />
          Pachai existe para sustentar o processo de pensamento.
        </p>
      </section>

      {/* 3. BLOCO — O QUE O PACHAI FAZ */}
      <section
        style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          marginBottom: 'clamp(4rem, 8vw, 6rem)',
        }}
        aria-label="O que o Pachai faz"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
          }}
        >
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              textAlign: 'center',
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            Escuta antes de estruturar
          </p>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              textAlign: 'center',
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            Reflete sem distorcer
          </p>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              textAlign: 'center',
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            Provoca sem pressionar
          </p>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              textAlign: 'center',
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            Permite pausar sem perder o fio
          </p>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              textAlign: 'center',
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            Retoma conversas de onde você parou
          </p>
        </div>
      </section>

      {/* 4. BLOCO — O QUE O PACHAI NÃO É (CONTRATO MENTAL) */}
      <section
        style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          marginBottom: 'clamp(4rem, 8vw, 6rem)',
        }}
        aria-label="O que o Pachai não é"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
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
            Pachai não decide por você.
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
            Não gera respostas prontas.
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
            Não transforma pensamento em checklist.
          </p>
        </div>
      </section>

      {/* 5. BLOCO — COMO FUNCIONA (SIMPLIFICADO) */}
      <section
        style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          marginBottom: 'clamp(4rem, 8vw, 6rem)',
        }}
        aria-label="Como funciona"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
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
            Você traz um assunto
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
            Pachai conversa com você
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
            Você chega à sua própria clareza
          </p>
        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 'clamp(4rem, 8vw, 6rem)',
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
          aria-label="Começar uma conversa no Pachai"
        >
          Começar uma conversa
        </Link>
      </section>

      {/* 7. FOOTER SIMPLES */}
      <footer
        style={{
          marginTop: 'auto',
          paddingTop: 'clamp(2rem, 4vw, 4rem)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          © Haendell Lopes —{' '}
          <a
            href="https://haendell.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            haendell.com
          </a>
        </p>
      </footer>
    </main>
  )
}
