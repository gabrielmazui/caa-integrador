export type Visibilidade = 'todos' | 'profissionais';

export interface Anexo {
  id: string;
  tipo: 'imagem' | 'audio' | 'video' | 'documento' | 'outro';
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
  arquivoIds?: string[];
}

export interface Arquivo {
  id: string;
  url: string;
  nomeArquivo: string;
  tipo: 'imagem' | 'audio' | 'video' | 'documento' | 'outro';
  mimeType: string;
  tamanhoBytes: number;
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
