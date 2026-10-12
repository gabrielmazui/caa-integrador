import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

export interface PerfilUsuario {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: 'profissional' | 'responsavel';
  especialidade: string | null;
  registroProfissional: string | null;
  telefone: string | null;
  fotoUrl: string | null;
  bio: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PerfilUpdateRequest {
  nome?: string;
  bio?: string;
  telefone?: string;
  especialidade?: string;
  fotoUrl?: string;
}

export type PerfilPublico = Pick<PerfilUsuario, 'id' | 'nome' | 'fotoUrl' | 'bio' | 'tipoUsuario' | 'especialidade'>;

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/perfil`;

  get() {
    return this.http.get<PerfilUsuario>(this.url);
  }

  getPublic(id: string) {
    return this.http.get<PerfilPublico>(this.url + '/' + id);
  }

  update(req: PerfilUpdateRequest) {
    return this.http.put<PerfilUsuario>(this.url, req);
  }
}
