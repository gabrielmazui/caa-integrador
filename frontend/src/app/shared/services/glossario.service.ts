import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Termo, TermoRequest } from '../models/glossario.models';

@Injectable({ providedIn: 'root' })
export class GlossarioService {
  private http = inject(HttpClient);
  private base(criancaId: string) {
    return `${environment.apiUrl}/criancas/${criancaId}/glossario`;
  }

  list(criancaId: string) {
    return this.http.get<Termo[]>(this.base(criancaId));
  }

  create(criancaId: string, req: TermoRequest) {
    return this.http.post<Termo>(this.base(criancaId), req);
  }
}
