# Pachai

Espaço de escuta contínua para decisões conscientes de produto.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth + Postgres)
- PWA

## Setup

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto com:
```
NEXT_PUBLIC_SUPABASE_URL=https://aznkixldjikctoruonuo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_chave_anon_do_projeto>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=<sua_chave_openai>
GOOGLE_SEARCH_API_KEY=AIzaSyAQpWYjiV8YjyTSpfKx3zLngxoI9kV3yI4
GOOGLE_CSE_ID=f42273c8c94dd4455
TAVILY_API_KEY=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
```

**Notas:**
- Substitua `<sua_chave_anon_do_projeto>` pela chave anon do projeto (encontre em Settings → API → Project API keys).
- Substitua `<sua_chave_openai>` pela sua chave da API da OpenAI (obtenha em https://platform.openai.com/api-keys).
- `GOOGLE_SEARCH_API_KEY` e `GOOGLE_CSE_ID` estão configurados para busca externa (Google como principal).
- `TAVILY_API_KEY` está configurada como alternativa de busca externa.

3. ✅ Banco de dados configurado!
   - Migration `001_initial_schema` já foi aplicada
   - Tabelas criadas: `products`, `conversations`, `messages`, `veredicts`
   - RLS habilitado em todas as tabelas

4. ✅ Autenticação configurada!
   - Login com e-mail e senha já está funcionando
   - Criação de conta disponível na tela de login
   - Não é necessário configurar OAuth ou magic link

4. Execute o projeto:
```bash
npm run dev
```

## Estrutura

- `app/` - Next.js App Router
- `supabase/migrations/` - Migrations do banco de dados
- `public/` - Arquivos estáticos (manifest, ícones)

## Funcionalidades V1

- ✅ Autenticação via e-mail e senha (signUp + signIn)
- ✅ Criação de produtos
- ✅ Chat funcional com Pachai (mock)
- ✅ Registro de vereditos
- ✅ Persistência de mensagens
- ✅ PWA básico

