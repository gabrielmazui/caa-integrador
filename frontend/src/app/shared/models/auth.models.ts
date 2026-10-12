export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: 'profissional' | 'responsavel';
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
  tipoUsuario: 'profissional' | 'responsavel';
  especialidade?: string;
  registroProfissional?: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export const ESPECIALIDADES_PROFISSIONAIS = [
  'Fonoaudiologia',
  'Terapia Ocupacional',
  'Psicologia',
  'Psicopedagogia',
  'Pedagogia',
  'Fisioterapia',
  'Medicina',
  'Enfermagem',
] as const;
