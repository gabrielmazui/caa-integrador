export type Visibilidade = 'todos' | 'profissionais';

export interface Anexo {
  id: string;
  tipo: 'imagem' | 'audio' | 'documento' | 'outro';
  url: string;
  nomeArquivo: string | null;
}

export interface Registro {
  id: string;
  conteudo: string;
  visibilidade: Visibilidade;
  fixado: boolean;
  criadoEm: string;
  atualizadoEm: string;
  autorId: string;
  autorNome: string;
  autorFotoUrl: string | null;
  totalComentarios: number;
  anexos?: Anexo[];
}

export interface RegistroRequest {
  conteudo: string;
  visibilidade: Visibilidade;
}

export interface Comentario {
  id: string;
  conteudo: string;
  criadoEm: string;
  atualizadoEm: string;
  autorId: string;
  autorNome: string;
  autorFotoUrl: string | null;
}

export interface ComentarioRequest {
  conteudo: string;
}
