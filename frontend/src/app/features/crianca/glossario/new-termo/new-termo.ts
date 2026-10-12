import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Termo } from '../../../../shared/models/glossario.models';
import { GlossarioService } from '../../../../shared/services/glossario.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-new-termo',
  imports: [FormsModule],
  templateUrl: './new-termo.html',
})
export class NewTermoComponent implements OnInit {
  criancaId = input.required<string>();
  existing = input<Termo | null>(null);
  created = output<Termo>();
  close = output<void>();

  private glossarioService = inject(GlossarioService);
  private toast = inject(ToastService);

  termo = signal('');
  definicao = signal('');
  loading = signal(false);
  submitted = signal(false);

  ngOnInit() {
    const term = this.existing();
    if (term) {
      this.termo.set(term.termo);
      this.definicao.set(term.definicao);
    }
  }

  submit() {
    this.submitted.set(true);
    if (!this.termo().trim() || !this.definicao().trim()) return;
    this.loading.set(true);
    const request = {
      termo: this.termo(),
      definicao: this.definicao(),
    };
    const operation = this.existing()
      ? this.glossarioService.update(this.criancaId(), this.existing()!.id, request)
      : this.glossarioService.create(this.criancaId(), request);
    operation.subscribe({
      next: (t) => { this.created.emit(t); this.loading.set(false); },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Erro ao salvar. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
