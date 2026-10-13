import { CategoriaPei } from './pei.models';
import { PEI_SECTIONS } from './pei-template';

export const PEI_GROUPS = [
  { title: 'Conhecer o estudante', description: 'Identificação, avaliações e observações.', keys: ['identificacao', 'anamnese', 'checklist', 'protocolo', 'resultado_protocolo', 'observacao_sala', 'observacao_recreio', 'observacao_outros', 'estudo_caso'] },
  { title: 'Definir objetivos', description: 'O que ensinar e como acompanhar o progresso.', keys: ['objetivo'] },
  { title: 'Planejar os apoios', description: 'Recursos e adaptações para o dia a dia.', keys: ['adaptacao_ambiente', 'recursos', 'adaptacao_material', 'adaptacao_sala', 'adaptacao_atividade', 'adaptacao_tempo'] },
  { title: 'Cuidar e revisar', description: 'Plano de segurança e revisões com a equipe.', keys: ['seguranca_gatilhos', 'seguranca_sinais', 'seguranca_comportamento', 'seguranca_acalmar', 'seguranca_prevenir', 'seguranca_substituta', 'seguranca_responsaveis', 'revisao'] },
].map(group => ({ ...group, sections: PEI_SECTIONS.filter(s => group.keys.includes(s.key)) }));

export const PEI_CHOICES: Partial<Record<CategoriaPei, string[]>> = {
  recursos: ['Comunicação alternativa (CAA)', 'Cartões de comunicação', 'Agenda visual', 'Checklist visual', 'Tablet', 'Computador', 'Material concreto de matemática', 'Ábaco', 'Régua de leitura', 'Material ampliado', 'Leitor de tela', 'Material tátil', 'Adaptador de lápis', 'Tesoura adaptada'],
  adaptacao_ambiente: ['Lugar próximo ao professor', 'Rotina visual', 'Materiais organizados e identificados', 'Espaço para se acalmar', 'Entrada adaptada', 'Saída acompanhada', 'Apoio na alimentação', 'Recreio assistido'],
  adaptacao_material: ['Caderno adaptado', 'Pauta ampliada', 'Livro digital', 'Material ampliado', 'Alto contraste', 'Texto em caixa alta', 'Texto com imagens', 'Material plastificado', 'Material tátil'],
  adaptacao_sala: ['Mesa adaptada', 'Cadeira adaptada', 'Apoio para os pés', 'Lugar estratégico para sentar', 'Organização fixa da sala', 'Redução de ruídos', 'Redução de estímulos visuais', 'Espaço para regulação sensorial'],
  adaptacao_atividade: ['Menos atividades ou questões', 'Etapas pequenas', 'Apoio visual', 'Material concreto', 'Responder apontando', 'Responder por colagem', 'Múltipla escolha', 'Atividade oral', 'Atividade digitada', 'Atividade em dupla', 'Pequeno grupo'],
  adaptacao_tempo: ['Pausas dentro da sala', 'Pausas fora da sala', 'Mais tempo para atividades', 'Mais tempo para avaliações'],
  seguranca_gatilhos: ['Transições sem aviso', 'Mudança inesperada de atividade', 'Aumento de demandas', 'Ruído elevado', 'Ambiente movimentado', 'Excesso de estímulos visuais', 'Interrupção de atividade de interesse', 'Espera prolongada'],
  seguranca_sinais: ['Levantar-se repetidamente', 'Andar pela sala', 'Dificuldade em iniciar a atividade', 'Repetir sons ou palavras', 'Choro', 'Recusa da atividade', 'Aumento de agitação corporal'],
  seguranca_comportamento: ['Choro intenso', 'Gritos contínuos', 'Tentativa de sair do ambiente', 'Empurrar pessoas', 'Arremessar objetos', 'Bater em objetos'],
  seguranca_acalmar: ['Reduzir estímulos visuais', 'Reduzir estímulos sonoros', 'Oferecer espaço para se acalmar', 'Permanecer próximo', 'Oferecer recurso de comunicação', 'Oferecer pausa', 'Oferecer ajuda'],
  seguranca_prevenir: ['Avisar antes das transições', 'Antecipar mudanças', 'Dividir atividades em etapas', 'Oferecer escolhas', 'Oferecer pausas', 'Alternar atividades', 'Apresentar rotina visual', 'Usar timer'],
  seguranca_substituta: ['Pedir pausa com cartão', 'Pedir ajuda', 'Aceitar ajuda', 'Pedir mudança de atividade', 'Comunicar desconforto', 'Comunicar necessidade de pausa'],
};

export const OBJECTIVE_FIELDS = [
  { key: 'acao', label: 'O que o estudante fará?', hint: 'Ex.: pedir ajuda usando o cartão de comunicação' },
  { key: 'antecedente', label: 'Em qual situação?', hint: 'Ex.: quando precisar de ajuda para iniciar uma tarefa' },
  { key: 'ambiente', label: 'Onde?', hint: 'Ex.: sala de aula' },
  { key: 'criterio', label: 'Como saberemos que conseguiu?', hint: 'Defina a medida e o critério de acerto, sem estimar resultados.' },
  { key: 'dias', label: 'Por quanto tempo?', hint: 'Número de dias consecutivos ou período de acompanhamento' },
  { key: 'passos', label: 'Quais são os pequenos passos?', hint: 'Uma etapa de ensino por linha, com os apoios necessários' },
];

export function composeNote(choices: string[], text: string, fields: Record<string, string> = {}): string {
  return [
    choices.map(c => '☑ ' + c).join('\n'),
    ...OBJECTIVE_FIELDS.filter(f => fields[f.key]?.trim()).map(f => f.label + '\n' + fields[f.key].trim()),
    text.trim(),
  ].filter(Boolean).join('\n\n');
}

export function unpackChoices(content: string, category: CategoriaPei): { choices: string[]; text: string } {
  const options = PEI_CHOICES[category] ?? [];
  const choices: string[] = [];
  const lines = content.split('\n').filter(line => {
    const option = options.find(o => line === '☑ ' + o);
    if (!option) return true;
    if (!choices.includes(option)) choices.push(option);
    return false;
  });
  return { choices, text: lines.join('\n').trim() };
}

