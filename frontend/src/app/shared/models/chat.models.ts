export interface Mensagem {
  id: string;
  conteudo: string;
  criadoEm: string;
  remetenteId: string;
  remetenteNome: string;
}

export interface MensagemRequest {
  conteudo: string;
}
