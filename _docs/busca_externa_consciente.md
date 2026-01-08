# Busca Externa Consciente no Pachai

## Visão Geral

A busca externa no Pachai permite que o agente pesquise referências externas durante o discovery de funcionalidades, mantendo o usuário dentro do produto e preservando a centralidade cognitiva.

**Veredito Fundador**: O Pachai busca para sustentar o raciocínio do produto, não para substituir o pensamento do usuário.

## Princípios Fundamentais (NÃO NEGOCIÁVEIS)

1. **O Pachai não busca automaticamente**
2. **Toda busca é explícita, declarada e contextualizada**
3. **Busca não é resposta, é insumo de raciocínio**
4. **Resultados externos nunca são verdade, nunca viram veredito automaticamente, nunca atualizam contexto cognitivo sozinhos**
5. **O usuário sempre sabe quando uma busca foi realizada**
6. **A busca é um ato cognitivo do Pachai, não um utilitário técnico invisível**

## Modelo Mental Correto

A busca externa no Pachai representa: **"Consultar referências para pensar melhor sobre o produto."**

### Ela:
- Alimenta discussão
- Amplia repertório
- Reduz vieses
- Sustenta decisões conscientes

### Ela não:
- Responde pelo usuário
- Decide
- Valida hipóteses automaticamente

## Arquitetura Técnica

### SearchContext Temporário

A busca é representada por um `SearchContext` temporário mantido apenas em memória:

```typescript
interface SearchResult {
  title: string
  snippet: string
  source: string
  url: string
}

interface SearchContext {
  query: string
  results: SearchResult[]
  executedAt: string
}
```

**Regras críticas**:
- NÃO persiste
- NÃO entra em conversas futuras
- NÃO atualiza contexto cognitivo
- Vive apenas durante uma chamada ao runtime

### Ordem Obrigatória de Contexto

Durante a geração de resposta, a ordem é fixa e imutável:

```
[ Contexto Cognitivo do Produto ]
→ [ Search Context (temporário) ]
→ [ Vereditos ]
→ [ Anexos da Conversa ]
→ [ Mensagens ]
```

**📌 Produto sempre vem antes do mundo externo.**

## Fluxos de Uso

### Caso 1: Usuário pede explicitamente busca

**Exemplo**: "Pesquise referências sobre onboarding em SaaS B2B."

**Fluxo**:
1. Runtime detecta intenção explícita (`detectExplicitSearchIntent`)
2. Runtime executa busca (`executeExternalSearch`)
3. Runtime cria `SearchContext` temporário
4. Runtime injeta `SearchContext` no `buildContextString()`
5. Pachai responde dizendo explicitamente que realizou a busca
6. Frontend exibe resultados visualmente (colapsáveis)
7. `SearchContext` é descartado após resposta (não persiste)

### Caso 2: Pachai sugere busca

**Exemplo**: "Para avançar nisso, pode ajudar consultar referências externas. Posso pesquisar sobre X?"

**Fluxo**:
1. Runtime detecta que seria útil sugerir busca (`shouldSuggestSearch`)
   - Apenas em estados `EXPLORATION` ou `CLARIFICATION`
   - Nunca em `CONVERGENCE` ou `VEREDICT_CHECK`
2. Pachai gera resposta sugerindo busca
3. Frontend detecta sugestão na resposta (via flag `suggestSearch`)
4. Frontend exibe componente de confirmação (UI, não mensagem)
5. Se usuário confirma (via UI):
   - Frontend chama `/api/search`
   - Frontend envia nova mensagem: "Sim, pesquise sobre X"
   - Runtime executa busca e injeta `SearchContext`
   - Pachai responde com resultados (sintetizando, comparando, relacionando)
6. Se usuário negar (via UI):
   - Conversa continua normalmente
   - Nenhuma busca ocorre

**📌 Confirmação é ação de interface, não mensagem de conversa.**

## Detecção de Intenção

### Detecção Explícita

A função `detectExplicitSearchIntent()` detecta apenas comandos claros:

- "pesquise"
- "busque referências"
- "procure exemplos de"
- "encontre estudos sobre"

**Regras**:
- Alta precisão > recall
- Sem ambiguidade: se houver dúvida → não buscar

### Sugestão de Busca

A função `shouldSuggestSearch()` só pode sugerir busca em:

- ✅ `EXPLORATION`
- ✅ `CLARIFICATION`

E nunca em:

- ❌ `CONVERGENCE`
- ❌ `VEREDICT_CHECK`

**Regra explícita**: O Pachai não sugere busca quando o usuário já está convergindo ou fechando uma decisão.

## Execução de Busca

A busca externa é executada via API (Tavily ou Bing):

- Suporta Tavily (preferencial) e Bing (fallback)
- Trata erros graciosamente (retorna array vazio se falhar)
- Limita resultados a 5 para não sobrecarregar contexto
- Nunca persiste resultados

## Prompt Engineering

### Quando busca foi executada

O Pachai deve:

1. **Sempre declarar** que realizou a busca
2. **Nunca tratar** resultados como verdade absoluta
3. **Usar resultados** como apoio ao raciocínio
4. **Manter tom** de par cognitivo, não de especialista

**Regra obrigatória**: A resposta nunca pode ser apenas uma lista de resultados.

O Pachai deve sempre:
- Sintetizar
- Comparar
- Relacionar com o produto
- Apontar implicações ou riscos
- Adicionar ganho cognitivo próprio

### Quando sugerir busca

Formato obrigatório: "Para avançar nisso, pode ajudar consultar referências externas. Posso pesquisar sobre [QUERY]?"

- Só sugerir em `EXPLORATION` ou `CLARIFICATION`
- Sempre aguardar confirmação explícita via UI
- Sugestão deve ser rara e justificada

## Prevenção de Automações Implícitas

### Guardrails Implementados

1. **Nunca buscar sem confirmação explícita**
   - Validação: busca só executa com intenção explícita ou confirmação do usuário

2. **Nunca persistir SearchContext**
   - Validação: `SearchContext` nunca é salvo no banco
   - Validação: `SearchContext` não entra em `product_contexts`

3. **Nunca criar veredito automaticamente de busca**
   - Validação: Sistema de vereditos ignora `SearchContext`
   - Validação: Vereditos só podem ser criados por ação explícita do usuário

4. **Sempre mencionar busca na resposta**
   - Validação: Prompt obriga Pachai a mencionar "Realizei uma busca sobre X"
   - Validação: Resposta sem menção de busca quando `SearchContext` existe = erro

5. **SearchContext tem vida útil limitada**
   - Validação: `SearchContext` só existe durante uma única chamada ao runtime
   - Validação: Não é reutilizado em chamadas subsequentes

## Exemplos de Uso

### Exemplo 1: Busca Explícita

**Usuário**: "Pesquise referências sobre onboarding em SaaS B2B"

**Pachai**: "Realizei uma busca sobre onboarding em SaaS B2B. Encontrei algumas referências interessantes: alguns produtos focam em ativação rápida, outros em educação profunda.

No contexto do seu produto, isso me faz pensar: qual é o objetivo principal do onboarding? É fazer o usuário usar rápido ou entender profundamente o valor?

Essa escolha impacta como você estrutura o fluxo inicial."

### Exemplo 2: Sugestão de Busca

**Usuário**: "Estou pensando em como estruturar o onboarding do produto"

**Pachai**: "Para avançar nisso, pode ajudar consultar referências externas. Posso pesquisar sobre como outros produtos SaaS estruturam onboarding para B2B?"

**[Componente de confirmação aparece na UI]**

**Usuário confirma**: Busca é executada e resultados são usados como insumo de raciocínio.

## Limitações e Restrições

1. **Busca requer API externa configurada**
   - Variáveis de ambiente: `TAVILY_API_KEY` ou `BING_SEARCH_API_KEY` + `BING_SEARCH_ENDPOINT`

2. **Resultados são temporários**
   - Não persistem entre conversas
   - Não entram no contexto cognitivo do produto

3. **Sugestão só em estados específicos**
   - Nunca sugere em `CONVERGENCE` ou `VEREDICT_CHECK`

4. **Resposta nunca é só lista**
   - Pachai sempre adiciona síntese, comparação e ganho cognitivo

## Decisões de Produto

### Por que busca é temporária?

Para preservar a centralidade cognitiva do produto. O contexto do produto sempre vem primeiro, e referências externas são apenas insumos temporários de raciocínio.

### Por que busca não persiste?

Para evitar que referências externas se tornem "verdade" no contexto do produto. O usuário deve sempre ter controle sobre o que entra no contexto cognitivo.

### Por que confirmação via UI?

Para deixar claro que a busca é um ato consciente, não uma automação invisível. O usuário sempre sabe quando uma busca foi realizada.

### Por que resposta não pode ser só lista?

Para manter o Pachai como par cognitivo que pensa junto, não como ferramenta de busca que apenas lista resultados.

## Testes de Aceitação Cognitiva

Ao testar a funcionalidade, pergunte:

1. **O Pachai ainda soa como par cognitivo?**
   - Se não, comportamento está errado

2. **A busca desviou ou aprofundou o raciocínio?**
   - Deve aprofundar, nunca desviar

3. **O usuário ainda sente controle?**
   - Deve sentir controle total sobre quando busca acontece

Se qualquer resposta for "não", o comportamento está errado e precisa ser ajustado.

## Arquivos Relacionados

- `app/lib/pachai/search-types.ts` - Tipos TypeScript
- `app/lib/pachai/search-detection.ts` - Detecção de intenção
- `app/lib/pachai/search-execution.ts` - Execução de busca
- `app/lib/pachai/prompts/search.ts` - Prompts específicos
- `app/lib/pachai/runtime.ts` - Integração no runtime
- `app/api/search/route.ts` - API route de busca
- `app/api/pachai/route.ts` - API route principal (modificada)
- `app/components/chat/SearchConfirmation.tsx` - Componente de confirmação
- `app/components/chat/SearchResults.tsx` - Componente de resultados
- `app/components/chat/ChatInterface.tsx` - Interface principal (modificada)

## Variáveis de Ambiente

```env
# API de Busca Externa (escolher uma)
TAVILY_API_KEY=...
# ou
BING_SEARCH_API_KEY=...
BING_SEARCH_ENDPOINT=https://api.bing.microsoft.com/v7.0/search
```
