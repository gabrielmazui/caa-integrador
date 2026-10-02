import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Termo } from '../../../../shared/models/glossario.models';
import { GlossarioService } from '../../../../shared/services/glossario.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-new-termo',
  imports: [FormsModule],
  templateUrl: './new-termo.html',
})
export class NewTermoComponent {
  criancaId = input.required<string>();
  created = output<Termo>();
  close = output<void>();

  private glossarioService = inject(GlossarioService);
  private toast = inject(ToastService);

  termo = signal('');
  definicao = signal('');
  loading = signal(false);
  submitted = signal(false);

  submit() {
    this.submitted.set(true);
    if (!this.termo().trim() || !this.definicao().trim()) return;
    this.loading.set(true);
    this.glossarioService.create(this.criancaId(), {
      termo: this.termo(),
      definicao: this.definicao(),
    }).subscribe({
      next: (t) => { this.created.emit(t); this.loading.set(false); },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Erro ao salvar. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
