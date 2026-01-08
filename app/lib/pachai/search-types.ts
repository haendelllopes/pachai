/**
 * Tipos para busca externa consciente no Pachai
 * 
 * SearchContext é temporário e nunca persiste.
 * Vive apenas durante uma chamada ao runtime.
 */

export interface SearchResult {
  title: string
  snippet: string
  source: string
  url: string
}

export interface SearchContext {
  query: string
  results: SearchResult[]
  executedAt: string
}

export interface SearchIntent {
  query: string
  confidence: number
}
