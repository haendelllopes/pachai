# Guia de Deploy no Vercel

## Opção 1: Deploy via Vercel CLI (Recomendado)

### 1. Login no Vercel
Execute no terminal:
```bash
vercel login
```
Siga as instruções para autenticar.

### 2. Deploy
Execute:
```bash
vercel --yes
```

Na primeira vez, responda:
- **Set up and deploy?** → Y
- **Which scope?** → Selecione seu time (haendelllopes-projects)
- **Link to existing project?** → N (criar novo)
- **Project name?** → pachai (ou pressione Enter)
- **Directory?** → . (pressione Enter)
- **Override settings?** → N

### 3. Configurar Variáveis de Ambiente

Após o deploy, configure as variáveis de ambiente no dashboard do Vercel:

1. Acesse: https://vercel.com/dashboard
2. Entre no projeto "pachai"
3. Vá em **Settings** > **Environment Variables**
4. Adicione todas as variáveis de ambiente necessárias:

```
NEXT_PUBLIC_SUPABASE_URL=https://ybosgihyhwkogodwobeb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlib3NnaWh5aHdrb2dvZHdvYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTEzNTQsImV4cCI6MjA3ODQ2NzM1NH0.gPwNEx_dluHVzwfZTPsXyctIx53D0tI3_4VwdC_9onU
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
OPENAI_API_KEY=<sua_chave_openai>
TAVILY_API_KEY=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
```

**IMPORTANTE:** 
- Substitua `https://seu-dominio.vercel.app` pela URL real que o Vercel gerar após o deploy.
- Substitua `<sua_chave_openai>` pela sua chave da API da OpenAI.
- Configure para todos os ambientes (Production, Preview, Development) ou apenas Production conforme sua necessidade.

### 4. Redeploy

Após configurar as variáveis, faça um novo deploy:
```bash
vercel --prod
```

Ou redeploy pelo dashboard do Vercel (clique em "Redeploy" na última deployment).

---

## Opção 2: Deploy via Dashboard Vercel (Mais Simples)

1. Acesse: https://vercel.com/new
2. Conecte seu repositório Git (GitHub/GitLab/Bitbucket)
3. Se não tiver Git, você pode fazer upload manual:
   - Zip o projeto (sem node_modules)
   - Use "Deploy" > "Upload"
4. Configure as variáveis de ambiente conforme acima
5. Deploy automático!

---

## Verificações Pós-Deploy

- [ ] Site está acessível
- [ ] Todas as variáveis de ambiente configuradas no Vercel:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] NEXT_PUBLIC_SITE_URL
  - [ ] OPENAI_API_KEY
  - [ ] TAVILY_API_KEY
- [ ] Login funciona
- [ ] Chat funciona
- [ ] Busca externa funciona (teste com "Pesquise referências sobre X")

