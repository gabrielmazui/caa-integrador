import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Comentario, ComentarioRequest, Registro, RegistroRequest } from '../models/feed.models';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private http = inject(HttpClient);
  private base(criancaId: string) {
    return `${environment.apiUrl}/criancas/${criancaId}/registros`;
  }

  list(criancaId: string, limit = 20, offset = 0) {
    return this.http.get<Registro[]>(this.base(criancaId), {
      params: { limit, offset },
    });
  }

  create(criancaId: string, req: RegistroRequest) {
    return this.http.post<Registro>(this.base(criancaId), req);
  }

  getComentarios(criancaId: string, registroId: string) {
    return this.http.get<Comentario[]>(`${this.base(criancaId)}/${registroId}/comentarios`);
  }

  addComentario(criancaId: string, registroId: string, req: ComentarioRequest) {
    return this.http.post<Comentario>(`${this.base(criancaId)}/${registroId}/comentarios`, req);
  }
}
