export interface Termo {
  id: string;
  termo: string;
  definicao: string;
  global: boolean;
  criadoPorNome: string;
  editadoPorNome: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TermoRequest {
  termo: string;
  definicao: string;
}
