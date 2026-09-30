export type Papel =
  | 'mae' | 'pai' | 'responsavel'
  | 'professor' | 'terapeuta' | 'coordenador' | 'outro';

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
  podeConvidar: boolean;
  podeEditarCrianca: boolean;
  criadoEm: string;
}

export interface CriancaRequest {
  nome: string;
  dataNascimento?: string;
  observacoes?: string;
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
  tipoUsuario: 'profissional' | 'familiar';
  especialidade: string | null;
  fotoUrl: string | null;
  papel: Papel;
  descricaoFuncao: string | null;
  status: 'convidado' | 'ativo' | 'inativo';
}

export interface AddMemberRequest {
  email: string;
  papel: Papel;
  descricaoFuncao?: string;
}

export const PAPEL_LABELS: Record<Papel, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  responsavel: 'Responsável',
  professor: 'Professor',
  terapeuta: 'Terapeuta',
  coordenador: 'Coordenador',
  outro: 'Outro',
};
