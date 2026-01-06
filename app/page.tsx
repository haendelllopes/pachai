/*
REGRAS DE LAYOUT PACHAI:
- Landing curta, sem rolagem excessiva
- CTA apenas no header
- Imagens servem à atmosfera, não à explicação
- Nenhum asset visual decorativo sem função clara
- O conteúdo deve caber quase inteiro em uma viewport comum
*/

import TopNavigation from '@/app/components/landing/TopNavigation'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <>
      <TopNavigation />
      
      {/* Hero */}
      <main
        className="hero"
        style={{
          textAlign: 'center',
          padding: 'clamp(3rem, 6vh, 5rem) 1.5rem',
          backgroundImage: 'url(/image/background-icon.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'var(--landing-bg, oklch(0.98 0.01 85))',
          backgroundBlendMode: 'multiply',
        }}
        role="main"
        aria-label="Página inicial do Pachai"
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 400,
            fontFamily: 'Georgia, "Times New Roman", serif',
            marginBottom: '1rem',
            color: 'var(--landing-text, oklch(0.25 0.03 45))',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            maxWidth: '600px',
            margin: '0 auto 1rem',
          }}
        >
          Um espaço para escutar antes de decidir
        </h1>

        <p
          className="subtitle"
          style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
            lineHeight: 1.7,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            maxWidth: '580px',
            fontWeight: 300,
            margin: '0 auto',
          }}
        >
          O Pachai não entrega respostas. Ele sustenta o processo até a clareza surgir.
        </p>

        <Image
          src="/image/hero-icon.jpeg"
          alt="Símbolo Pachai"
          width={96}
          height={96}
          className="hero-icon"
          style={{
            width: '96px',
            height: '96px',
            margin: '2rem auto 0',
            opacity: 0.9,
          }}
        />
      </main>

      {/* Manifesto */}
      <section
        className="manifesto"
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: 'clamp(2rem, 4vh, 3rem) 1.5rem',
          fontSize: '1.05rem',
          lineHeight: 1.6,
          opacity: 0.9,
        }}
        aria-label="Manifesto do Pachai"
      >
        <p
          style={{
            marginBottom: '1rem',
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          O Pachai é um espaço de escuta contínua.
          Ele não decide por você, não acelera conclusões
          e não transforma reflexão em checklist.
        </p>

        <p
          style={{
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          Ele sustenta perguntas até que o veredito
          seja realmente seu.
        </p>
      </section>

      {/* Divisor Visual */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2.5rem auto' }}>
        <Image
          src="/image/divisor-icon.jpeg"
          alt=""
          width={420}
          height={100}
          aria-hidden="true"
          className="divider"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '420px',
            opacity: 0.6,
            height: 'auto',
          }}
        />
      </div>

      {/* Como Funciona */}
      <section
        className="how-it-works"
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 1.5rem 3rem',
        }}
        aria-label="Como funciona"
      >
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          <li
            style={{
              marginBottom: '1rem',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            Você traz o que está em aberto.
          </li>
          <li
            style={{
              marginBottom: '1rem',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            O Pachai sustenta a conversa com cuidado.
          </li>
          <li
            style={{
              marginBottom: '1rem',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
              fontWeight: 300,
            }}
          >
            O veredito só existe quando você o reconhece.
          </li>
        </ul>
      </section>

      {/* Footer */}
      <footer
        className="footer"
        style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          fontSize: '0.85rem',
          opacity: 0.6,
          color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
        }}
      >
        <span>Pachai — Espaço de Escuta Contínua</span>
      </footer>
    </>
  )
}
