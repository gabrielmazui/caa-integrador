import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { AnotacaoPei, AnotacaoPeiRequest } from '../models/pei.models';

@Injectable({ providedIn: 'root' })
export class PeiService {
  private http = inject(HttpClient);
  private base(criancaId: string) {
    return `${environment.apiUrl}/criancas/${criancaId}/anotacoes-pei`;
  }

  list(criancaId: string, ano?: number, semestre?: 1 | 2) {
    let params = new HttpParams();
    if (ano) params = params.set('ano', ano);
    if (semestre) params = params.set('semestre', semestre);
    return this.http.get<AnotacaoPei[]>(this.base(criancaId), { params });
  }

  create(criancaId: string, req: AnotacaoPeiRequest) {
    return this.http.post<AnotacaoPei>(this.base(criancaId), req);
  }
}
