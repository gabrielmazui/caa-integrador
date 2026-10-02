import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs';
import { AnotacaoPei, CATEGORIA_BADGE, CATEGORIA_LABELS, CategoriaPei } from '../../../shared/models/pei.models';
import { PeiService } from '../../../shared/services/pei.service';
import { CriancaStateService } from '../crianca-state.service';
import { NewAnotacaoComponent } from './new-anotacao/new-anotacao';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { RelativeTimePipe } from '../../../shared/components/relative-time.pipe';

@Component({
  imports: [FormsModule, NewAnotacaoComponent, EmptyStateComponent, LoadingSpinnerComponent, RelativeTimePipe],
  templateUrl: './pei.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class PeiComponent {
  private peiService = inject(PeiService);
  private state = inject(CriancaStateService);

  criancaId = computed(() => this.state.current()?.id ?? '');
  criancaNome = computed(() => this.state.current()?.nome ?? '');

  anotacoes = signal<AnotacaoPei[]>([]);
  loading = signal(true);
  showModal = signal(false);
  filterAno = signal(new Date().getFullYear());
  filterSemestre = signal<0 | 1 | 2>(0);
  categoriaLabels = CATEGORIA_LABELS;
  categoriaBadge = CATEGORIA_BADGE;
  anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  categorias = computed<CategoriaPei[]>(() => {
    const all: CategoriaPei[] = ['comunicacao', 'socializacao', 'aprendizagem', 'autonomia', 'comportamento', 'sensorial', 'objetivo', 'estrategia', 'outro'];
    const ids = new Set(this.anotacoes().map(a => a.categoria));
    return all.filter(c => ids.has(c));
  });

  byCategoria = computed<Record<string, AnotacaoPei[]>>(() => {
    const map: Record<string, AnotacaoPei[]> = {};
    for (const a of this.anotacoes()) {
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

  onCreated(a: AnotacaoPei) {
    this.anotacoes.update(prev => [a, ...prev]);
    this.showModal.set(false);
  }
}
