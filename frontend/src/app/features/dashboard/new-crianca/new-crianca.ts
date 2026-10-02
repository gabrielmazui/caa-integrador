import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CriancaService } from '../../../shared/services/crianca.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  imports: [FormsModule],
  templateUrl: './new-crianca.html',
})
export class NewCriancaComponent {
  private criancaService = inject(CriancaService);
  private router = inject(Router);
  private toast = inject(ToastService);

  nome = signal('');
  dataNascimento = signal('');
  observacoes = signal('');
  loading = signal(false);
  submitted = signal(false);

  close() {
    this.router.navigate(['/home']);
  }

  submit() {
    this.submitted.set(true);
    if (!this.nome().trim()) return;
    this.loading.set(true);
    this.criancaService.create({
      nome: this.nome(),
      dataNascimento: this.dataNascimento() || undefined,
      observacoes: this.observacoes() || undefined,
    }).subscribe({
      next: (c) => this.router.navigate(['/crianca', c.id, 'feed']),
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Erro ao criar criança. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
