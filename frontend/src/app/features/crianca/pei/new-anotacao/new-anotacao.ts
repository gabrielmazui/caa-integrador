import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PEI_SECTIONS } from '../../../../shared/models/pei-template';
import { PEI_GROUPS, PEI_CHOICES, OBJECTIVE_FIELDS, composeNote, unpackChoices } from '../../../../shared/models/pei-guide';
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
  initialCategory = input<CategoriaPei>('anamnese');
  initialYear = input(new Date().getFullYear());
  initialSemester = input<0 | 1 | 2>(0);
  created = output<AnotacaoPei>();
  close = output<void>();

  private peiService = inject(PeiService);
  private toast = inject(ToastService);

  categorias = Object.entries(CATEGORIA_LABELS) as [CategoriaPei, string][];
  groups = PEI_GROUPS;
  legacy = this.categorias.filter(([key]) => !PEI_SECTIONS.some(s => s.key === key));
  objectiveFields = OBJECTIVE_FIELDS;
  fields: Record<string, string> = {};
  selections = signal<Partial<Record<CategoriaPei, string[]>>>({});
  choices() { return PEI_CHOICES[this.categoria()] ?? []; }
  selected() { return this.selections()[this.categoria()] ?? []; }
  toggle(option: string) {
    const selected = this.selected();
    this.selections.update(values => ({ ...values, [this.categoria()]:
      selected.includes(option) ? selected.filter(v => v !== option) : [...selected, option] }));
  }
  content() {
    return composeNote(this.selected(), this.conteudo(),
      this.categoria() === 'objetivo' && !this.existing() ? this.fields : {});
  }
  requestClose() {
    if (this.loading()) return;
    const original = this.existing()?.conteudo.trim() ?? '';
    if (this.content().trim() !== original && !window.confirm('Fechar sem salvar esta anotação?')) return;
    this.close.emit();
  }
  categoria = signal<CategoriaPei>('anamnese');
  orientacao() { return PEI_SECTIONS.find(s => s.key === this.categoria())?.hint ?? 'Registre a observação e seu contexto. Esta categoria ficará no anexo de registros complementares.'; }
  conteudo = signal('');
  semestre = signal<1 | 2>(new Date().getMonth() < 6 ? 1 : 2);
  ano = signal(new Date().getFullYear());
  loading = signal(false);
  submitted = signal(false);

  ngOnInit() {
    this.categoria.set(this.initialCategory());
    this.ano.set(this.initialYear());
    if (this.initialSemester()) this.semestre.set(this.initialSemester() as 1 | 2);
    const annotation = this.existing();
    if (annotation) {
      this.categoria.set(annotation.categoria);
      const parsed = unpackChoices(annotation.conteudo, annotation.categoria);
      this.conteudo.set(parsed.text);
      this.selections.set({ [annotation.categoria]: parsed.choices });
      this.semestre.set(annotation.semestre);
      this.ano.set(annotation.ano);
    }
  }

  setSemestre(v: string) {
    this.semestre.set(+v as 1 | 2);
  }

  submit() {
    this.submitted.set(true);
    if (this.loading() || !this.content().trim() || this.content().length > 10000
      || !Number.isInteger(this.ano()) || this.ano() < 2000 || this.ano() > 2200) return;
    this.loading.set(true);
    const req: AnotacaoPeiRequest = {
      categoria: this.categoria(),
      conteudo: this.content(),
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
