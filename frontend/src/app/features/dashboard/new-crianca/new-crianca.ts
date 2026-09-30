import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CriancaService } from '../../../shared/services/crianca.service';

@Component({
  imports: [FormsModule],
  templateUrl: './new-crianca.html',
})
export class NewCriancaComponent {
  private criancaService = inject(CriancaService);
  private router = inject(Router);

  nome = signal('');
  dataNascimento = signal('');
  observacoes = signal('');
  error = signal('');
  loading = signal(false);

  close() {
    this.router.navigate(['/home']);
  }

  submit() {
    if (!this.nome().trim()) return;
    this.error.set('');
    this.loading.set(true);
    this.criancaService.create({
      nome: this.nome(),
      dataNascimento: this.dataNascimento() || undefined,
      observacoes: this.observacoes() || undefined,
    }).subscribe({
      next: (c) => this.router.navigate(['/crianca', c.id, 'feed']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erro ao criar. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
