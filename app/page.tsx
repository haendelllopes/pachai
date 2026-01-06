import TopNavigation from '@/app/components/landing/TopNavigation'

export default function LandingPage() {
  return (
    <>
      <TopNavigation />
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--landing-bg, oklch(0.98 0.01 85))',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'calc(70px + clamp(3rem, 5vw, 4rem))',
          paddingBottom: 'clamp(3rem, 5vw, 4rem)',
          paddingLeft: 'clamp(1.5rem, 4vw, 2rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 2rem)',
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
            marginBottom: 'clamp(3rem, 6vw, 4rem)',
          }}
          aria-labelledby="hero-headline"
        >
          {/* Headline */}
          <h1
            id="hero-headline"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              fontFamily: 'Georgia, "Times New Roman", serif',
              marginBottom: '1rem',
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
              textAlign: 'center',
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              maxWidth: '580px',
              fontWeight: 300,
            }}
          >
            Pachai ajuda você a amadurecer decisões complexas sem pressa, sem perder contexto e sem abrir mão da autoria.
          </p>
        </section>

        {/* 2. O QUE PACHAI É / NÃO É (MESCLADO) */}
        <section
          style={{
            maxWidth: '600px',
            width: '100%',
            margin: '0 auto',
            marginBottom: 'clamp(3rem, 6vw, 4rem)',
          }}
          aria-label="O que o Pachai é e não é"
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
              Pachai não decide por você.
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
              Não transforma pensamento em checklist.
            </p>
          </div>
        </section>

        {/* 3. COMO FUNCIONA */}
        <section
          style={{
            maxWidth: '600px',
            width: '100%',
            margin: '0 auto',
            marginBottom: 'clamp(3rem, 6vw, 4rem)',
          }}
          aria-label="Como funciona"
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

        {/* FOOTER */}
        <footer
          style={{
            marginTop: 'auto',
            paddingTop: 'clamp(2rem, 3vw, 3rem)',
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
    </>
  )
}
