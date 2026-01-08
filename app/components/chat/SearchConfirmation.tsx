'use client'

interface SearchConfirmationProps {
  query: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Componente de confirmação de busca via UI
 * 
 * Confirmação é ação de interface, não mensagem de conversa.
 * Mostra query proposta e permite confirmar ou cancelar.
 */
export default function SearchConfirmation({
  query,
  onConfirm,
  onCancel
}: SearchConfirmationProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">
            O Pachai sugeriu buscar referências externas sobre:
          </p>
          <p className="text-sm font-medium mb-3">
            "{query}"
          </p>
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Sim, pesquise
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Não, obrigado
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
