export interface Termo {
  id: string;
  termo: string;
  definicao: string;
  global: boolean;
  atualizadoEm: string;
}

export interface TermoRequest {
  termo: string;
  definicao: string;
}
