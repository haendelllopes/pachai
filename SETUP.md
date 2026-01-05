# Setup do Projeto Pachai

## Credenciais do Supabase

As seguintes credenciais foram configuradas para o projeto "pachai":

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ybosgihyhwkogodwobeb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlib3NnaWh5aHdrb2dvZHdvYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTEzNTQsImV4cCI6MjA3ODQ2NzM1NH0.gPwNEx_dluHVzwfZTPsXyctIx53D0tI3_4VwdC_9onU
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Banco de Dados

✅ Migration `001_initial_schema` aplicada com sucesso!

Tabelas criadas:
- `products` - Produtos do usuário
- `conversations` - Conversas por produto
- `messages` - Mensagens do chat
- `veredicts` - Vereditos registrados

Todas as tabelas têm RLS (Row Level Security) habilitado.

## Próximos Passos

1. **Configurar Google OAuth no Supabase:**
   - Acesse o dashboard do Supabase: https://ybosgihyhwkogodwobeb.supabase.co
   - Vá em Authentication > Providers
   - Habilite o Google Provider
   - Configure o Client ID e Client Secret do Google
   - Adicione a URL de callback: `http://localhost:3000/auth/callback` (para desenvolvimento)

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Executar o projeto:**
   ```bash
   npm run dev
   ```

## Configuração do Google OAuth

Para configurar o OAuth no Google Cloud Console:

1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em "APIs & Services" > "Credentials"
4. Crie um "OAuth 2.0 Client ID"
5. Configure as URLs autorizadas:
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `https://ybosgihyhwkogodwobeb.supabase.co/auth/v1/callback`
6. Copie o Client ID e Client Secret para o Supabase

## Estrutura do Banco

- **products**: Produtos criados pelos usuários
- **conversations**: Conversas (1 por produto na V1)
- **messages**: Mensagens do chat (user ou pachai)
- **veredicts**: Decisões registradas com pain, value e notes

