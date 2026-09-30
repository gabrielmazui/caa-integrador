export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: 'profissional' | 'familiar';
  especialidade: string | null;
  registroProfissional: string | null;
  fotoUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: Usuario;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: 'profissional' | 'familiar';
  especialidade?: string;
  registroProfissional?: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}
