import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Mensagem, MensagemRequest } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private base(criancaId: string) {
    return `${environment.apiUrl}/criancas/${criancaId}/chat`;
  }

  list(criancaId: string, limit = 50) {
    return this.http.get<Mensagem[]>(this.base(criancaId), { params: { limit } });
  }

  send(criancaId: string, req: MensagemRequest) {
    return this.http.post<Mensagem>(this.base(criancaId), req);
  }
}
