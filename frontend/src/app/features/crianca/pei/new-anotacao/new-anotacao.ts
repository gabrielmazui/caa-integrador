import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnotacaoPei, AnotacaoPeiRequest, CATEGORIA_LABELS, CategoriaPei } from '../../../../shared/models/pei.models';
import { PeiService } from '../../../../shared/services/pei.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-new-anotacao',
  imports: [FormsModule],
  templateUrl: './new-anotacao.html',
})
export class NewAnotacaoComponent implements OnInit {
  criancaId = input.required<string>();
  existing = input<AnotacaoPei | null>(null);
  created = output<AnotacaoPei>();
  close = output<void>();

  private peiService = inject(PeiService);
  private toast = inject(ToastService);

  categorias = Object.entries(CATEGORIA_LABELS) as [CategoriaPei, string][];
  categoria = signal<CategoriaPei>('comunicacao');
  conteudo = signal('');
  semestre = signal<1 | 2>(1);
  ano = signal(new Date().getFullYear());
  loading = signal(false);
  submitted = signal(false);

  ngOnInit() {
    const annotation = this.existing();
    if (annotation) {
      this.categoria.set(annotation.categoria);
      this.conteudo.set(annotation.conteudo);
      this.semestre.set(annotation.semestre);
      this.ano.set(annotation.ano);
    }
  }

  setSemestre(v: string) {
    this.semestre.set(+v as 1 | 2);
  }

  submit() {
    this.submitted.set(true);
    if (!this.conteudo().trim()) return;
    this.loading.set(true);
    const req: AnotacaoPeiRequest = {
      categoria: this.categoria(),
      conteudo: this.conteudo(),
      semestre: this.semestre(),
      ano: this.ano(),
    };
    const operation = this.existing()
      ? this.peiService.update(this.criancaId(), this.existing()!.id, req)
      : this.peiService.create(this.criancaId(), req);
    operation.subscribe({
      next: (a) => { this.created.emit(a); this.loading.set(false); },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Erro ao salvar. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
