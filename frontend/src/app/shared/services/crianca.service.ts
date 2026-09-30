import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { AddMemberRequest, Crianca, CriancaRequest, CriancaUpdateRequest, Membro } from '../models/crianca.models';

@Injectable({ providedIn: 'root' })
export class CriancaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/criancas`;

  list() {
    return this.http.get<Crianca[]>(this.base);
  }

  get(id: string) {
    return this.http.get<Crianca>(`${this.base}/${id}`);
  }

  create(req: CriancaRequest) {
    return this.http.post<Crianca>(this.base, req);
  }

  getMembers(criancaId: string) {
    return this.http.get<Membro[]>(`${this.base}/${criancaId}/membros`);
  }

  addMember(criancaId: string, req: AddMemberRequest) {
    return this.http.post<Membro>(`${this.base}/${criancaId}/membros`, req);
  }

  update(id: string, req: CriancaUpdateRequest) {
    return this.http.put<Crianca>(`${this.base}/${id}`, req);
  }
}
