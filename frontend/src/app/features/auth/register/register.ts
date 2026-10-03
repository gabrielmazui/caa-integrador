import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { ESPECIALIDADES_PROFISSIONAIS } from '../../../shared/models/auth.models';

@Component({
  imports: [FormsModule, RouterLink, ToastComponent],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  nome = signal('');
  email = signal('');
  senha = signal('');
  tipoUsuario = signal<'profissional' | 'responsavel'>('responsavel');
  especialidadeSelecionada = signal('');
  outraEspecialidade = signal('');
  registroProfissional = signal('');
  error = signal('');
  loading = signal(false);
  submitted = signal(false);

  isProfissional = computed(() => this.tipoUsuario() === 'profissional');
  especialidades = ESPECIALIDADES_PROFISSIONAIS;

  especialidade = computed(() => this.especialidadeSelecionada() === 'outro'
    ? this.outraEspecialidade().trim()
    : this.especialidadeSelecionada());

  submit() {
    this.submitted.set(true);
    if (!this.nome().trim() || !this.email().trim() || this.senha().length < 8
      || (this.isProfissional() && !this.especialidade())) return;
    this.error.set('');
    this.loading.set(true);
    const req = {
      nome: this.nome(),
      email: this.email(),
      senha: this.senha(),
      tipoUsuario: this.tipoUsuario(),
      ...(this.isProfissional() && {
        especialidade: this.especialidade(),
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
