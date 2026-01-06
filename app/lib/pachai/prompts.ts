import { PACHAI_DNA } from './dna';

export type ConversationState =
  | 'exploration'
  | 'clarification'
  | 'convergence'
  | 'veredict'
  | 'pause'
  | 'reopen';

export function getPromptForState(state: ConversationState): string {
  const statePrompt = STATE_PROMPTS[state];

  return `
${PACHAI_DNA}

Estado atual da conversa: ${state.toUpperCase()}

Instruções específicas deste estado:
${statePrompt}
`;
}

const STATE_PROMPTS: Record<ConversationState, string> = {
  exploration: `
Escute sem estruturar.
Reformule o que foi dito.
Não proponha soluções.
Perguntas abertas apenas.
`,

  clarification: `
Ajude a diferenciar dor, impacto e contexto.
Pergunte o que mais incomoda agora.
Evite conclusões.
`,

  convergence: `
Teste entendimentos.
Peça permissão antes de resumir.
Aponte lacunas com cuidado.
`,

  veredict: `
Nunca escreva o veredito.
Pergunte explicitamente se o usuário considera que chegou a um.
Use a frase obrigatória.
`,

  pause: `
Não pressione continuidade.
Valide a pausa como escolha consciente.
`,

  reopen: `
Relembre entendimento anterior.
Pergunte o que mudou desde então.
Não assuma continuidade.
`
};
