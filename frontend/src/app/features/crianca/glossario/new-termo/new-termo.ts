import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Termo } from '../../../../shared/models/glossario.models';
import { GlossarioService } from '../../../../shared/services/glossario.service';

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

  termo = signal('');
  definicao = signal('');
  error = signal('');
  loading = signal(false);

  submit() {
    if (!this.termo().trim() || !this.definicao().trim()) return;
    this.error.set('');
    this.loading.set(true);
    this.glossarioService.create(this.criancaId(), {
      termo: this.termo(),
      definicao: this.definicao(),
    }).subscribe({
      next: (t) => { this.created.emit(t); this.loading.set(false); },
      error: (err) => { this.error.set(err.error?.message ?? 'Erro ao salvar.'); this.loading.set(false); },
    });
  }
}
