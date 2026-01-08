'use client'

import { useState } from 'react'
import { SearchResult } from '@/app/lib/pachai/search-types'

interface SearchResultsProps {
  query: string
  results: SearchResult[]
}

/**
 * Componente para exibir resultados de busca externa
 * 
 * Princípios de UX:
 * - Resultados não competem com a resposta do Pachai
 * - Devem ser colapsáveis
 * - Devem ser secundários
 * - Claramente marcados como temporários
 */
export default function SearchResults({ query, results }: SearchResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!results || results.length === 0) {
    return null
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>🔍</span>
          <span>
            Referências externas encontradas ({results.length})
            <span className="ml-2 text-xs">(temporárias)</span>
          </span>
        </span>
        <span className="text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground mb-2">
            Busca realizada: "{query}"
          </p>
          {results.map((result, index) => (
            <div
              key={index}
              className="p-3 bg-muted/50 rounded-md border border-border/50"
            >
              <h4 className="text-sm font-medium mb-1">
                {result.title}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                {result.source}
              </p>
              <p className="text-xs text-foreground/80 mb-2 line-clamp-2">
                {result.snippet}
              </p>
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Ver fonte →
                </a>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground italic mt-2">
            ⚠️ Estes são resultados de busca externa. Use como referência, não como verdade absoluta.
          </p>
        </div>
      )}
    </div>
  )
}
