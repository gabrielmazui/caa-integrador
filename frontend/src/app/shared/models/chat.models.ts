import { Anexo } from './feed.models';

export interface Mensagem {
  id: string;
  conteudo: string;
  criadoEm: string;
  remetenteId: string;
  remetenteNome: string;
  anexos?: Anexo[];
}

export interface MensagemRequest {
  conteudo: string;
  arquivoIds?: string[];
}
