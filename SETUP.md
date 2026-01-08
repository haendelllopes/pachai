# Setup do Projeto Pachai

## Credenciais do Supabase

As seguintes credenciais foram configuradas para o projeto "pachai":

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aznkixldjikctoruonuo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_chave_anon_do_projeto>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=<sua_chave_openai>
TAVILY_API_KEY=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
```

**IMPORTANTE:** 
- Substitua `<sua_chave_anon_do_projeto>` pela chave anon do projeto correto (encontre em Settings → API → Project API keys).
- Substitua `<sua_chave_openai>` pela sua chave da API da OpenAI (obtenha em https://platform.openai.com/api-keys).
- A `TAVILY_API_KEY` já está configurada para busca externa consciente.

## Banco de Dados

✅ Migration `001_initial_schema` aplicada com sucesso!

Tabelas criadas:
- `products` - Produtos do usuário
- `conversations` - Conversas por produto
- `messages` - Mensagens do chat
- `veredicts` - Vereditos registrados

Todas as tabelas têm RLS (Row Level Security) habilitado.

## Próximos Passos

1. **Aplicar Migration no Supabase:**
   - Acesse o dashboard do Supabase: https://aznkixldjikctoruonuo.supabase.co
   - Vá em SQL Editor
   - Cole e execute o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`
   - Verifique se as tabelas foram criadas: products, conversations, messages, veredicts

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Executar o projeto:**
   ```bash
   npm run dev
   ```

## Autenticação

O Pachai usa autenticação por e-mail e senha via Supabase Auth:

- **Criar conta:** Nome, sobrenome, e-mail e senha
- **Entrar:** E-mail e senha
- Nome e sobrenome são salvos em `user_metadata` do Supabase
- Não é necessário configurar OAuth ou magic link
- E-mail de confirmação pode estar habilitado no Supabase, mas não bloqueia o login

## Estrutura do Banco

- **products**: Produtos criados pelos usuários
- **conversations**: Conversas (1 por produto na V1)
- **messages**: Mensagens do chat (user ou pachai)
- **veredicts**: Decisões registradas com pain, value e notes

