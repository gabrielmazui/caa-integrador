export type Papel = 'profissional' | 'responsavel';
export type FuncaoProfissional = 'professor' | 'terapeuta' | 'outro';
export type RelacaoResponsavel = 'mae' | 'pai' | 'outro';

export interface Crianca {
  id: string;
  nome: string;
  dataNascimento: string | null;
  fotoUrl: string | null;
  observacoes: string | null;
  diagnostico: string | null;
  cid10: string | null;
  papel: Papel;
  podePublicar: boolean;
  podeComentar: boolean;
  podeVerChat: boolean;
  podeGerenciarMembros: boolean;
  podeEditarCrianca: boolean;
  coordenador: boolean;
  relacaoResponsavel: RelacaoResponsavel | null;
  descricaoRelacao: string | null;
  criadoEm: string;
}

export interface CriancaRequest {
  nome: string;
  dataNascimento?: string;
  observacoes?: string;
  relacaoResponsavel?: RelacaoResponsavel;
  descricaoRelacao?: string;
}

export interface CriancaUpdateRequest {
  nome?: string;
  dataNascimento?: string;
  fotoUrl?: string;
  observacoes?: string;
  diagnostico?: string;
  cid10?: string;
}

export interface Membro {
  id: string;
  nome: string;
  tipoUsuario: 'profissional' | 'responsavel';
  especialidade: string | null;
  fotoUrl: string | null;
  papel: Papel;
  funcaoProfissional: FuncaoProfissional | null;
  relacaoResponsavel: RelacaoResponsavel | null;
  descricaoFuncao: string | null;
  descricaoRelacao: string | null;
  podeGerenciarMembros: boolean;
  coordenador: boolean;
  status: 'convidado' | 'ativo' | 'inativo';
}

export interface AddMemberRequest {
  email: string;
  papel: Papel;
  funcaoProfissional?: FuncaoProfissional;
  relacaoResponsavel?: RelacaoResponsavel;
  descricaoFuncao?: string;
  descricaoRelacao?: string;
}

export interface LeaveChildRequest {
  novoCoordenadorId?: string;
  confirmarExclusao: boolean;
}

export interface MeuVinculoRequest {
  relacaoResponsavel?: RelacaoResponsavel;
  descricaoRelacao?: string;
}

export const PAPEL_LABELS: Record<Papel, string> = {
  profissional: 'Profissional',
  responsavel: 'Responsável',
};

export const FUNCAO_PROFISSIONAL_LABELS: Record<FuncaoProfissional, string> = {
  professor: 'Professor',
  terapeuta: 'Terapeuta',
  outro: 'Outro',
};

export const RELACAO_RESPONSAVEL_LABELS: Record<RelacaoResponsavel, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  outro: 'Outro',
};
