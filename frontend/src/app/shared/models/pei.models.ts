import { PEI_SECTIONS } from './pei-template';

export type CategoriaPei = typeof PEI_SECTIONS[number]['key']
  | 'comunicacao' | 'socializacao' | 'aprendizagem' | 'autonomia'
  | 'comportamento' | 'sensorial' | 'objetivo' | 'estrategia' | 'outro';

export interface AnotacaoPei {
  id: string;
  categoria: CategoriaPei;
  conteudo: string;
  semestre: 1 | 2;
  ano: number;
  criadoEm: string;
  atualizadoEm: string;
  autorId: string;
  autorNome: string;
  editadoPorNome: string | null;
}

export interface AnotacaoPeiRequest {
  categoria: CategoriaPei;
  conteudo: string;
  semestre: 1 | 2;
  ano: number;
}

export const CATEGORIA_LABELS: Record<CategoriaPei, string> = {
  identificacao: '1. Identificação escolar',
  anamnese: '2.1 Anamnese',
  checklist: '2.1 Resultados de checklists',
  protocolo: '2.2 Protocolo aplicado',
  resultado_protocolo: '2.2 Resultados do protocolo',
  observacao_sala: '2.2 Observação em sala',
  observacao_recreio: '2.2 Observação no recreio',
  observacao_outros: '2.2 Observação em outros ambientes',
  estudo_caso: '3. Estudo de caso',
  adaptacao_ambiente: '5. Adaptações de ambiente',
  recursos: '6. Recursos e acessibilidade',
  adaptacao_material: '6. Adaptação de material',
  adaptacao_sala: '6. Adaptação da sala',
  adaptacao_atividade: '6. Adaptação de atividades',
  adaptacao_tempo: '6. Adaptação de tempo',
  seguranca_gatilhos: '7. Gatilhos observados',
  seguranca_sinais: '7. Sinais iniciais',
  seguranca_comportamento: '7. Forma mais severa',
  seguranca_acalmar: '7. Como acalmar',
  seguranca_prevenir: '7. Como prevenir',
  seguranca_substituta: '7. Habilidade substituta',
  seguranca_responsaveis: '7. Responsáveis pelo plano',
  revisao: '8. Revisões do PEI',
  comunicacao: 'Comunicação',
  socializacao: 'Socialização',
  aprendizagem: 'Aprendizagem',
  autonomia: 'Autonomia',
  comportamento: 'Comportamento',
  sensorial: 'Sensorial',
  objetivo: '4. Objetivos de longo prazo',
  estrategia: 'Estratégia',
  outro: 'Outro',
};

export const CATEGORIA_BADGE: Record<CategoriaPei, string> = {
  identificacao: 'badge-primary',
  anamnese: 'badge-primary',
  checklist: 'badge-primary',
  protocolo: 'badge-primary',
  resultado_protocolo: 'badge-primary',
  observacao_sala: 'badge-primary',
  observacao_recreio: 'badge-primary',
  observacao_outros: 'badge-primary',
  estudo_caso: 'badge-primary',
  adaptacao_ambiente: 'badge-primary',
  recursos: 'badge-primary',
  adaptacao_material: 'badge-primary',
  adaptacao_sala: 'badge-primary',
  adaptacao_atividade: 'badge-primary',
  adaptacao_tempo: 'badge-primary',
  seguranca_gatilhos: 'badge-primary',
  seguranca_sinais: 'badge-primary',
  seguranca_comportamento: 'badge-primary',
  seguranca_acalmar: 'badge-primary',
  seguranca_prevenir: 'badge-primary',
  seguranca_substituta: 'badge-primary',
  seguranca_responsaveis: 'badge-primary',
  revisao: 'badge-primary',
  comunicacao: 'badge-primary',
  socializacao: 'badge-secondary',
  aprendizagem: 'badge-accent',
  autonomia: 'badge-info',
  comportamento: 'badge-warning',
  sensorial: 'badge-success',
  objetivo: 'badge-error',
  estrategia: 'badge-neutral',
  outro: 'badge-ghost',
};

export const CATEGORIA_BORDER: Record<CategoriaPei, string> = {
  identificacao: 'border-l-primary',
  anamnese: 'border-l-primary',
  checklist: 'border-l-primary',
  protocolo: 'border-l-primary',
  resultado_protocolo: 'border-l-primary',
  observacao_sala: 'border-l-primary',
  observacao_recreio: 'border-l-primary',
  observacao_outros: 'border-l-primary',
  estudo_caso: 'border-l-primary',
  adaptacao_ambiente: 'border-l-primary',
  recursos: 'border-l-primary',
  adaptacao_material: 'border-l-primary',
  adaptacao_sala: 'border-l-primary',
  adaptacao_atividade: 'border-l-primary',
  adaptacao_tempo: 'border-l-primary',
  seguranca_gatilhos: 'border-l-primary',
  seguranca_sinais: 'border-l-primary',
  seguranca_comportamento: 'border-l-primary',
  seguranca_acalmar: 'border-l-primary',
  seguranca_prevenir: 'border-l-primary',
  seguranca_substituta: 'border-l-primary',
  seguranca_responsaveis: 'border-l-primary',
  revisao: 'border-l-primary',
  comunicacao: 'border-l-primary',
  socializacao: 'border-l-secondary',
  aprendizagem: 'border-l-accent',
  autonomia: 'border-l-info',
  comportamento: 'border-l-warning',
  sensorial: 'border-l-success',
  objetivo: 'border-l-error',
  estrategia: 'border-l-neutral',
  outro: 'border-l-base-300',
};
