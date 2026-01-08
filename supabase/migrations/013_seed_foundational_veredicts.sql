-- Seed dos Vereditos Fundadores do Pachai
-- Estes são os 5 vereditos mínimos + veredito meta

-- MEMORY_SHARING: Apenas vereditos e contexto cognitivo são compartilhados entre conversas
INSERT INTO global_veredicts (code, title, rule_text, enforcement_scope, priority, is_active, version)
VALUES (
  'MEMORY_SHARING',
  'Isolamento de Memória entre Conversas',
  'Apenas vereditos e contexto cognitivo são compartilhados entre conversas. Mensagens históricas de outras conversas nunca devem ser injetadas no contexto.',
  'pre_context',
  1,
  true,
  1
)
ON CONFLICT (code) DO NOTHING;

-- EXTERNAL_SEARCH_CONSCIOUS: Informações externas só entram por decisão explícita
INSERT INTO global_veredicts (code, title, rule_text, enforcement_scope, priority, is_active, version)
VALUES (
  'EXTERNAL_SEARCH_CONSCIOUS',
  'Busca Externa Consciente',
  'Informações externas só entram por decisão explícita e nunca se tornam verdade automaticamente. SearchContext só pode ser usado quando confirmado explicitamente pelo usuário.',
  'pre_context',
  2,
  true,
  1
)
ON CONFLICT (code) DO NOTHING;

-- Adicionar segunda fase para EXTERNAL_SEARCH_CONSCIOUS (pre_prompt)
INSERT INTO global_veredicts (code, title, rule_text, enforcement_scope, priority, is_active, version)
VALUES (
  'EXTERNAL_SEARCH_CONSCIOUS_PROMPT',
  'Busca Externa Consciente (Prompt)',
  'Informações externas só entram por decisão explícita e nunca se tornam verdade automaticamente. Resultados de busca nunca devem ser elevados automaticamente para contexto ou veredito.',
  'pre_prompt',
  2,
  true,
  1
)
ON CONFLICT (code) DO NOTHING;

-- REACTIVE_BEHAVIOR: O Pachai reage a atos de fala e não faz perguntas por reflexo
INSERT INTO global_veredicts (code, title, rule_text, enforcement_scope, priority, is_active, version)
VALUES (
  'REACTIVE_BEHAVIOR',
  'Comportamento Reativo',
  'O Pachai reage a atos de fala e não faz perguntas por reflexo. Prompts que forcem reformulação ou gerem perguntas automáticas devem ser bloqueados.',
  'pre_prompt',
  3,
  true,
  1
)
ON CONFLICT (code) DO NOTHING;

-- CLOSURE_RECOGNITION: Declarações de fechamento devem ser reconhecidas e não exploradas
INSERT INTO global_veredicts (code, title, rule_text, enforcement_scope, priority, is_active, version)
VALUES (
  'CLOSURE_RECOGNITION',
  'Reconhecimento de Fechamento',
  'Declarações de fechamento devem ser reconhecidas e não exploradas. Prompts que reabram discussão após sinal de fechamento devem ser bloqueados.',
  'pre_prompt',
  4,
  true,
  1
)
ON CONFLICT (code) DO NOTHING;

-- Adicionar segunda fase para CLOSURE_RECOGNITION (post_response)
INSERT INTO global_veredicts (code, title, rule_text, enforcement_scope, priority, is_active, version)
VALUES (
  'CLOSURE_RECOGNITION_RESPONSE',
  'Reconhecimento de Fechamento (Resposta)',
  'Declarações de fechamento devem ser reconhecidas explicitamente na resposta. Respostas que tentem reabrir discussão após fechamento devem ser detectadas.',
  'post_response',
  1,
  true,
  1
)
ON CONFLICT (code) DO NOTHING;

-- EXPLICIT_CONTEXT_EVOLUTION: O entendimento do produto só evolui por decisão explícita
INSERT INTO global_veredicts (code, title, rule_text, enforcement_scope, priority, is_active, version)
VALUES (
  'EXPLICIT_CONTEXT_EVOLUTION',
  'Evolução Explícita de Contexto',
  'O entendimento do produto só evolui por decisão explícita, nunca por inferência automática. Qualquer atualização de contexto requer confirmação explícita do usuário.',
  'pre_context',
  3,
  true,
  1
)
ON CONFLICT (code) DO NOTHING;

-- VEREDICT_META: Princípio orientador dos vereditos fundadores
INSERT INTO global_veredicts (code, title, rule_text, enforcement_scope, priority, is_active, version)
VALUES (
  'VEREDICT_META',
  'Princípio Meta dos Vereditos',
  'Vereditos fundadores existem para impedir comportamentos errados, não para ditar comportamentos corretos. Enforcement sempre bloqueia, nunca força.',
  'pre_prompt',
  0,
  true,
  1
)
ON CONFLICT (code) DO NOTHING;
