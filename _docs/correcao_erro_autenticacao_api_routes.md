# Correção: Erro de Autenticação em API Routes

**Data:** 2026-01-07  
**Problema:** `AuthSessionMissingError` em rotas de API

## Problema Identificado

O erro `AuthSessionMissingError: Auth session missing!` estava ocorrendo na rota `PATCH /api/conversations/[id]` quando tentava autenticar o usuário.

### Causa Raiz

A função `createClientFromRequest()` estava sendo chamada sem passar o objeto `request` como parâmetro. Isso fazia com que os cookies de autenticação não fossem lidos corretamente do request, resultando em uma sessão de autenticação ausente.

### Contexto Técnico

Em rotas de API do Next.js, especialmente em ambientes serverless como Vercel, há uma diferença importante entre:

1. **`cookies()` do `next/headers`**: Pode não estar sincronizado com o middleware em alguns casos
2. **Cookies do `request` diretamente**: Garante que os cookies atualizados pelo middleware sejam lidos corretamente

## Solução Implementada

### 1. Atualização de `createClientFromRequest()`

**Arquivo:** `app/lib/supabase/server-api.ts`

**Mudança:**
- Antes: Função assíncrona que usava `cookies()` do `next/headers`
- Depois: Função síncrona que recebe `NextRequest` e lê cookies diretamente do request

```typescript
// Antes
export async function createClientFromRequest() {
  const cookieStore = await cookies()
  // ...
}

// Depois
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
```

### 2. Atualização das Rotas de API

**Arquivo:** `app/api/conversations/[id]/route.ts`

**Mudança:**
- Passar o objeto `request` para `createClientFromRequest()`
- Remover `await` já que a função não é mais assíncrona

```typescript
// Antes
const supabase = await createClientFromRequest()

// Depois
const supabase = createClientFromRequest(request)
```

## Benefícios

1. **Sincronização garantida**: Os cookies são lidos diretamente do request, garantindo que estejam sincronizados com o middleware
2. **Melhor performance**: Função síncrona elimina overhead desnecessário
3. **Mais confiável**: Funciona corretamente em ambientes serverless

## Rotas Afetadas

- ✅ `PATCH /api/conversations/[id]`
- ✅ `DELETE /api/conversations/[id]`

## Notas Adicionais

Outras rotas de API (`/api/products`, `/api/messages`, `/api/veredicts`) usam `createClient()` de `@/app/lib/supabase/server`, que funciona corretamente para Server Components e algumas rotas de API. Se problemas similares ocorrerem nessas rotas, considere migrá-las para usar `createClientFromRequest(request)` também.

## Referências

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

