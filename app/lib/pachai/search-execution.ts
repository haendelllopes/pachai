import { SearchResult } from './search-types'

/**
 * Executa busca externa usando API externa
 * 
 * Restrições críticas:
 * - Nunca chamado automaticamente
 * - Só executa quando há confirmação explícita do usuário
 * - Resultados nunca são persistidos
 * - Trata erros graciosamente (retorna array vazio se falhar)
 */
export async function executeExternalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    console.log('[Search] Empty query provided')
    return []
  }

  console.log('[Search] Executing search for query:', query)
  console.log('[Search] TAVILY_API_KEY exists:', !!process.env.TAVILY_API_KEY)

  // Tentar Tavily primeiro (API moderna e fácil de usar)
  if (process.env.TAVILY_API_KEY) {
    try {
      console.log('[Search] Attempting Tavily search...')
      const results = await executeTavilySearch(query)
      console.log('[Search] Tavily search successful, results:', results.length)
      return results
    } catch (error) {
      console.error('[Search] Tavily search failed:', error)
      // Fallback para Bing se Tavily falhar
    }
  } else {
    console.warn('[Search] TAVILY_API_KEY not found in environment')
  }

  // Tentar Bing como alternativa ou fallback
  if (process.env.BING_SEARCH_API_KEY && process.env.BING_SEARCH_ENDPOINT) {
    try {
      return await executeBingSearch(query)
    } catch (error) {
      console.error('Bing search failed:', error)
    }
  }

  // Se nenhuma API estiver configurada ou ambas falharem, retornar array vazio
  // Tratamento gracioso: não quebrar o fluxo se busca falhar
  console.warn('No search API configured or all APIs failed')
  return []
}

/**
 * Executa busca usando Tavily API
 */
async function executeTavilySearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY not configured')
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 5, // Limitar a 5 resultados para não sobrecarregar contexto
    }),
  })

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.results || !Array.isArray(data.results)) {
    return []
  }

  return data.results.map((result: any) => ({
    title: result.title || 'Sem título',
    snippet: result.content || result.snippet || '',
    source: result.url ? new URL(result.url).hostname : 'Fonte desconhecida',
    url: result.url || '',
  }))
}

/**
 * Executa busca usando Bing Search API
 */
async function executeBingSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY
  const endpoint = process.env.BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search'

  if (!apiKey) {
    throw new Error('BING_SEARCH_API_KEY not configured')
  }

  const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&count=5`, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`Bing API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.webPages || !data.webPages.value || !Array.isArray(data.webPages.value)) {
    return []
  }

  return data.webPages.value.map((result: any) => ({
    title: result.name || 'Sem título',
    snippet: result.snippet || '',
    source: result.displayUrl || result.url ? new URL(result.url || result.displayUrl).hostname : 'Fonte desconhecida',
    url: result.url || '',
  }))
}
