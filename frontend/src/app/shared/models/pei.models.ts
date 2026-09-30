export type CategoriaPei =
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
}

export interface AnotacaoPeiRequest {
  categoria: CategoriaPei;
  conteudo: string;
  semestre: 1 | 2;
  ano: number;
}

export const CATEGORIA_LABELS: Record<CategoriaPei, string> = {
  comunicacao: 'Comunicação',
  socializacao: 'Socialização',
  aprendizagem: 'Aprendizagem',
  autonomia: 'Autonomia',
  comportamento: 'Comportamento',
  sensorial: 'Sensorial',
  objetivo: 'Objetivo',
  estrategia: 'Estratégia',
  outro: 'Outro',
};

export const CATEGORIA_BADGE: Record<CategoriaPei, string> = {
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
