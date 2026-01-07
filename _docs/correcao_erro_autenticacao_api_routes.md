# Correção: Erro de Autenticação em API Routes

**Data:** 2026-01-07  
**Problema:** `AuthSessionMissingError` em rotas de API

## Problema Identificado

O erro `AuthSessionMissingError: Auth session missing!` estava ocorrendo na rota `PATCH /api/conversations/[id]` quando tentava autenticar o usuário.

### Causa Raiz

O erro ocorria porque os cookies de autenticação não estavam sendo lidos corretamente na rota da API. Em ambientes serverless como Vercel, pode haver dessincronia entre o middleware (que atualiza os cookies) e a rota da API (que precisa ler os cookies).

### Contexto Técnico

Em rotas de API do Next.js, especialmente em ambientes serverless como Vercel, há uma diferença importante entre:

1. **`cookies()` do `next/headers`**: Sincronizado com o middleware, mas pode falhar em alguns contextos
2. **Cookies do `request` diretamente**: Fallback confiável quando `cookies()` não está disponível

A solução implementada usa uma abordagem híbrida: tenta `cookies()` primeiro (sincronizado com middleware) e faz fallback para `request.cookies` se necessário.

## Solução Implementada

### 1. Atualização de `createClientFromRequest()`

**Arquivo:** `app/lib/supabase/server-api.ts`

**Mudança:**
- Antes: Função síncrona que lia cookies apenas do `request`
- Depois: Função assíncrona que tenta `cookies()` primeiro (sincronizado com middleware) e faz fallback para `request.cookies`

```typescript
// Antes
export function createClientFromRequest(request: NextRequest) {
  return createServerClient(
    // ...
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // ...
      },
    }
  )
}

// Depois
export async function createClientFromRequest(request: NextRequest) {
  const cookieStore = await cookies()
  
  return createServerClient(
    // ...
    {
      cookies: {
        getAll() {
          // Tentar cookies() primeiro (sincronizado com middleware)
          try {
            return cookieStore.getAll()
          } catch {
            // Fallback para cookies do request
            return request.cookies.getAll()
          }
        },
        // ...
      },
    }
  )
}
```

### 2. Atualização das Rotas de API

**Arquivo:** `app/api/conversations/[id]/route.ts`

**Mudança:**
- Passar o objeto `request` para `createClientFromRequest()`
- Usar `await` já que a função agora é assíncrona

```typescript
// Antes
const supabase = createClientFromRequest(request)

// Depois
const supabase = await createClientFromRequest(request)
```

## Benefícios

1. **Sincronização garantida**: Tenta usar `cookies()` primeiro, que está sincronizado com o middleware
2. **Fallback robusto**: Se `cookies()` falhar, usa `request.cookies` como fallback
3. **Mais confiável**: Funciona corretamente em ambientes serverless e diferentes contextos de execução
4. **Compatibilidade**: Funciona tanto quando o middleware atualiza os cookies quanto em casos onde isso não acontece

## Rotas Afetadas

- ✅ `PATCH /api/conversations/[id]`
- ✅ `DELETE /api/conversations/[id]`

## Notas Adicionais

Outras rotas de API (`/api/products`, `/api/messages`, `/api/veredicts`) usam `createClient()` de `@/app/lib/supabase/server`, que funciona corretamente para Server Components e algumas rotas de API. Se problemas similares ocorrerem nessas rotas, considere migrá-las para usar `createClientFromRequest(request)` também.

## Referências

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

