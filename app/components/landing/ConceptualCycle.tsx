/**
 * Elemento gráfico conceitual: ciclo incompleto
 * Representa continuidade de pensamento, não linearidade e espaço para reflexão
 */
export default function ConceptualCycle() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        opacity: 0.6,
        maxWidth: '100%',
        height: 'auto',
        width: 'clamp(80px, 15vw, 120px)',
      }}
      aria-hidden="true"
      role="img"
      aria-label="Ciclo incompleto representando continuidade de pensamento"
    >
      {/* Ciclo incompleto com linha orgânica */}
      <path
        d="M60 20 Q40 30 30 50 Q20 70 30 90 Q40 110 60 100 Q80 90 90 70 Q100 50 90 30 Q80 20 60 20"
        stroke="var(--landing-cycle-stroke, oklch(0.60 0.06 55))"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="0"
        style={{
          strokeDashoffset: 0,
          opacity: 0.7,
        }}
      />
      {/* Linha quebra o ciclo, criando abertura proposital */}
      <line
        x1="60"
        y1="20"
        x2="65"
        y2="15"
        stroke="var(--landing-bg, oklch(0.98 0.01 85))"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Ponto sutil no início do ciclo */}
      <circle
        cx="60"
        cy="20"
        r="2"
        fill="var(--landing-cycle-stroke, oklch(0.60 0.06 55))"
        opacity="0.5"
      />
    </svg>
  )
}

