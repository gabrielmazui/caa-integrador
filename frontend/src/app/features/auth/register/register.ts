import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  nome = signal('');
  email = signal('');
  senha = signal('');
  tipoUsuario = signal<'profissional' | 'familiar'>('familiar');
  especialidade = signal('');
  registroProfissional = signal('');
  error = signal('');
  loading = signal(false);

  isProfissional = computed(() => this.tipoUsuario() === 'profissional');

  submit() {
    this.error.set('');
    this.loading.set(true);
    const req = {
      nome: this.nome(),
      email: this.email(),
      senha: this.senha(),
      tipoUsuario: this.tipoUsuario(),
      ...(this.isProfissional() && {
        especialidade: this.especialidade() || undefined,
        registroProfissional: this.registroProfissional() || undefined,
      }),
    };
    this.auth.register(req).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erro ao criar conta. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
