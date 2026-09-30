import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnotacaoPei, AnotacaoPeiRequest, CATEGORIA_LABELS, CategoriaPei } from '../../../../shared/models/pei.models';
import { PeiService } from '../../../../shared/services/pei.service';

@Component({
  selector: 'app-new-anotacao',
  imports: [FormsModule],
  templateUrl: './new-anotacao.html',
})
export class NewAnotacaoComponent {
  criancaId = input.required<string>();
  created = output<AnotacaoPei>();

  private peiService = inject(PeiService);

  categorias = Object.entries(CATEGORIA_LABELS) as [CategoriaPei, string][];
  categoria = signal<CategoriaPei>('comunicacao');
  conteudo = signal('');
  semestre = signal<1 | 2>(1);
  ano = signal(new Date().getFullYear());
  error = signal('');
  loading = signal(false);

  close = output<void>();

  setSemestre(v: string) {
    this.semestre.set(+v as 1 | 2);
  }

  submit() {
    if (!this.conteudo().trim()) return;
    this.error.set('');
    this.loading.set(true);
    const req: AnotacaoPeiRequest = {
      categoria: this.categoria(),
      conteudo: this.conteudo(),
      semestre: this.semestre(),
      ano: this.ano(),
    };
    this.peiService.create(this.criancaId(), req).subscribe({
      next: (a) => { this.created.emit(a); this.loading.set(false); },
      error: (err) => { this.error.set(err.error?.message ?? 'Erro ao salvar.'); this.loading.set(false); },
    });
  }
}
