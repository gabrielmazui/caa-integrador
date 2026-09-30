import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthResponse, LoginRequest, RegisterRequest, Usuario } from '../../shared/models/auth.models';

const TOKEN_KEY = 'caa_token';
const USER_KEY = 'caa_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly currentUser = signal<Usuario | null>(this.loadUser());
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isProfissional = computed(() => this.currentUser()?.tipoUsuario === 'profissional');

  login(req: LoginRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => this.store(res)),
    );
  }

  register(req: RegisterRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, req).pipe(
      tap(res => this.store(res)),
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private store(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
    this.currentUser.set(res.usuario);
  }

  refreshUser(partial: Partial<Usuario>) {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  private loadUser(): Usuario | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
