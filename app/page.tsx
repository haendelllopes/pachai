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
          Um espaço para pensar produtos com rigor
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
          O Pachai é uma plataforma de conversação contínua para Product Leaders amadurecerem decisões complexas, registrarem vereditos e manterem o entendimento do produto vivo ao longo do tempo.
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
          O Pachai não é um chat genérico.
          Não é um assistente que entrega respostas.
          Não é documentação automática.
        </p>

        <p
          style={{
            marginBottom: '1rem',
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          Ele existe para sustentar decisões difíceis.
        </p>

        <p
          style={{
            marginBottom: '1rem',
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          Você traz o problema como ele é.
          O Pachai reage ao que é dito, tensiona implicações, aponta riscos e alternativas.
          O veredito só existe quando você o reconhece explicitamente.
        </p>

        <p
          style={{
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          Nada é inferido.
          Nada é decidido automaticamente.
          O pensamento continua sendo humano.
        </p>
      </section>

      {/* Divisor Visual */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem auto' }}>
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

      {/* Princípios Fundamentais */}
      <section
        className="principles"
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 1.5rem 2rem',
        }}
        aria-label="Princípios fundamentais"
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
            • Conversas são privadas e isoladas.
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
            • Decisões são registradas como vereditos explícitos.
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
            • O contexto do produto é um artefato vivo, não histórico de chat.
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
            • O agente reage a atos de fala, não faz perguntas por reflexo.
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
            • Encerramentos são reconhecidos, não explorados.
          </li>
        </ul>
      </section>

      {/* Como Funciona */}
      <section
        className="how-it-works"
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 1.5rem 2rem',
        }}
        aria-label="Como funciona"
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 400,
            fontFamily: 'Georgia, "Times New Roman", serif',
            marginBottom: '1rem',
            color: 'var(--landing-text, oklch(0.25 0.03 45))',
            letterSpacing: '-0.01em',
          }}
        >
          Como o Pachai funciona
        </h2>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
            marginBottom: '1rem',
          }}
        >
          Cada produto possui seu próprio espaço de pensamento.
        </p>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
            marginBottom: '1rem',
          }}
        >
          As conversas servem para amadurecer decisões específicas.
          Os vereditos registram aquilo que foi decidido de forma consciente.
          O contexto cognitivo do produto evolui explicitamente ao longo do tempo.
        </p>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          Nada se perde.
          Nada é assumido.
          Tudo pode ser retomado.
        </p>
      </section>

      {/* Contexto Cognitivo do Produto */}
      <section
        className="product-context"
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 1.5rem 2rem',
        }}
        aria-label="Contexto cognitivo do produto"
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 400,
            fontFamily: 'Georgia, "Times New Roman", serif',
            marginBottom: '1rem',
            color: 'var(--landing-text, oklch(0.25 0.03 45))',
            letterSpacing: '-0.01em',
          }}
        >
          Contexto cognitivo do produto
        </h2>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          O Pachai mantém um entendimento consolidado e compartilhável sobre o produto.
        </p>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
            marginTop: '1rem',
          }}
        >
          Não é conversa.
          Não é anexo.
          Não é histórico.
        </p>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
            marginTop: '1rem',
          }}
        >
          É a base cognitiva que elimina a necessidade de recontextualizar tudo a cada nova conversa — inclusive quando outra pessoa entra no produto.
        </p>
      </section>

      {/* Busca Externa Consciente */}
      <section
        className="external-search"
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 1.5rem 2rem',
        }}
        aria-label="Busca externa consciente"
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 400,
            fontFamily: 'Georgia, "Times New Roman", serif',
            marginBottom: '1rem',
            color: 'var(--landing-text, oklch(0.25 0.03 45))',
            letterSpacing: '-0.01em',
          }}
        >
          Busca externa consciente
        </h2>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
          }}
        >
          Quando necessário, referências externas podem ser consultadas.
        </p>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
            marginTop: '1rem',
          }}
        >
          Sempre de forma explícita.
          Sempre temporária.
          Sempre como insumo de raciocínio — nunca como verdade automática.
        </p>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
            fontWeight: 300,
            marginTop: '1rem',
          }}
        >
          O produto vem antes do mundo externo.
        </p>
      </section>

      {/* Footer */}
      <footer
        className="footer"
        style={{
          textAlign: 'center',
          padding: '2rem 1.5rem',
          fontSize: '1rem',
          lineHeight: 1.6,
          opacity: 0.9,
          color: 'var(--landing-text-light, oklch(0.45 0.02 50))',
          fontWeight: 300,
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        <p style={{ margin: 0 }}>
          O Pachai existe para sustentar decisões conscientes.
        </p>
        <p style={{ margin: '1rem 0 0 0' }}>
          Nada é inferido.
          Nada é automático.
          O entendimento evolui com intenção.
        </p>
      </footer>
    </>
  )
}
