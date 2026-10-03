import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs';
import { AnotacaoPei, CATEGORIA_BADGE, CATEGORIA_BORDER, CATEGORIA_LABELS, CategoriaPei } from '../../../shared/models/pei.models';
import { PeiService } from '../../../shared/services/pei.service';
import { CriancaStateService } from '../crianca-state.service';
import { NewAnotacaoComponent } from './new-anotacao/new-anotacao';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { RelativeTimePipe } from '../../../shared/components/relative-time.pipe';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  imports: [FormsModule, NewAnotacaoComponent, EmptyStateComponent, LoadingSpinnerComponent, RelativeTimePipe],
  templateUrl: './pei.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class PeiComponent {
  private peiService = inject(PeiService);
  private state = inject(CriancaStateService);
  private toast = inject(ToastService);

  criancaId = computed(() => this.state.current()?.id ?? '');
  criancaNome = computed(() => this.state.current()?.nome ?? '');

  anotacoes = signal<AnotacaoPei[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingAnnotation = signal<AnotacaoPei | null>(null);
  filterAno = signal(new Date().getFullYear());
  filterSemestre = signal<0 | 1 | 2>(0);
  filterCategoria = signal<CategoriaPei | ''>('');
  filterAutor = signal('');
  categoriaLabels = CATEGORIA_LABELS;
  categoriaBadge = CATEGORIA_BADGE;
  categoriaBorder = CATEGORIA_BORDER;
  todasCategorias = Object.entries(CATEGORIA_LABELS) as [CategoriaPei, string][];
  anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  autores = computed(() => Array.from(new Map(this.anotacoes().map(a => [a.autorId, a.autorNome])).entries())
    .map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome)));

  filteredAnnotations = computed(() => this.anotacoes().filter(a =>
    (!this.filterCategoria() || a.categoria === this.filterCategoria())
    && (!this.filterAutor() || a.autorId === this.filterAutor())));

  categorias = computed<CategoriaPei[]>(() => {
    const all: CategoriaPei[] = ['comunicacao', 'socializacao', 'aprendizagem', 'autonomia', 'comportamento', 'sensorial', 'objetivo', 'estrategia', 'outro'];
    const ids = new Set(this.filteredAnnotations().map(a => a.categoria));
    return all.filter(c => ids.has(c));
  });

  byCategoria = computed<Record<string, AnotacaoPei[]>>(() => {
    const map: Record<string, AnotacaoPei[]> = {};
    for (const a of this.filteredAnnotations()) {
      (map[a.categoria] ??= []).push(a);
    }
    return map;
  });

  constructor() {
    toObservable(this.criancaId).pipe(
      distinctUntilChanged(),
      filter(id => !!id),
      takeUntilDestroyed(),
    ).subscribe(() => this.load());
  }

  setFilterSemestre(v: string) {
    this.filterSemestre.set(+v as 0 | 1 | 2);
    this.load();
  }

  load() {
    const id = this.criancaId();
    if (!id) return;
    this.loading.set(true);
    const sem = this.filterSemestre() as 1 | 2 | undefined;
    this.peiService.list(id, this.filterAno(), sem || undefined).subscribe({
      next: items => { this.anotacoes.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSaved(a: AnotacaoPei) {
    this.anotacoes.update(prev => [a, ...prev.filter(item => item.id !== a.id)]);
    this.showModal.set(false);
    this.editingAnnotation.set(null);
  }

  edit(annotation: AnotacaoPei) {
    this.editingAnnotation.set(annotation);
  }

  delete(annotation: AnotacaoPei) {
    if (!window.confirm('Excluir esta anotação do PEI?')) return;
    this.peiService.delete(this.criancaId(), annotation.id).subscribe({
      next: () => {
        this.anotacoes.update(items => items.filter(item => item.id !== annotation.id));
        this.toast.success('Anotação excluída.');
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Não foi possível excluir a anotação.'),
    });
  }
}
