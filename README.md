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
NEXT_PUBLIC_SUPABASE_URL=https://ybosgihyhwkogodwobeb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlib3NnaWh5aHdrb2dvZHdvYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTEzNTQsImV4cCI6MjA3ODQ2NzM1NH0.gPwNEx_dluHVzwfZTPsXyctIx53D0tI3_4VwdC_9onU
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. ✅ Banco de dados configurado!
   - Migration `001_initial_schema` já foi aplicada
   - Tabelas criadas: `products`, `conversations`, `messages`, `veredicts`
   - RLS habilitado em todas as tabelas

4. Configure Google OAuth no Supabase:
   - Acesse o dashboard: https://ybosgihyhwkogodwobeb.supabase.co
   - Vá em Authentication > Providers
   - Habilite o Google Provider
   - Adicione a URL de callback: `http://localhost:3000/auth/callback`
   - Veja instruções detalhadas em `SETUP.md`

4. Execute o projeto:
```bash
npm run dev
```

## Estrutura

- `app/` - Next.js App Router
- `supabase/migrations/` - Migrations do banco de dados
- `public/` - Arquivos estáticos (manifest, ícones)

## Funcionalidades V1

- ✅ Autenticação via Google OAuth
- ✅ Criação de produtos
- ✅ Chat funcional com Pachai (mock)
- ✅ Registro de vereditos
- ✅ Persistência de mensagens
- ✅ PWA básico

