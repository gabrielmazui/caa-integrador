import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs';
import { Termo } from '../../../shared/models/glossario.models';
import { GlossarioService } from '../../../shared/services/glossario.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CriancaStateService } from '../crianca-state.service';
import { NewTermoComponent } from './new-termo/new-termo';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { RelativeTimePipe } from '../../../shared/components/relative-time.pipe';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  imports: [FormsModule, NewTermoComponent, EmptyStateComponent, LoadingSpinnerComponent, RelativeTimePipe],
  templateUrl: './glossario.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class GlossarioComponent {
  private glossarioService = inject(GlossarioService);
  auth = inject(AuthService);
  private state = inject(CriancaStateService);
  private toast = inject(ToastService);

  crianca = this.state.current;
  criancaId = computed(() => this.crianca()?.id ?? '');
  criancaNome = computed(() => this.crianca()?.nome ?? '');

  termos = signal<Termo[]>([]);
  loading = signal(true);
  showModal = signal(false);
  search = signal('');
  selectedTerm = signal<Termo | null>(null);
  editingTerm = signal<Termo | null>(null);

  global = computed(() =>
    this.termos().filter(t => t.global && this.matchesSearch(t))
  );
  especificos = computed(() =>
    this.termos().filter(t => !t.global && this.matchesSearch(t))
  );

  constructor() {
    toObservable(this.criancaId).pipe(
      distinctUntilChanged(),
      filter(id => !!id),
      takeUntilDestroyed(),
    ).subscribe(id => {
      this.termos.set([]);
      this.loading.set(true);
      this.glossarioService.list(id).subscribe({
        next: list => { this.termos.set(list); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  onSaved(t: Termo) {
    this.termos.update(prev => [...prev.filter(item => item.id !== t.id), t]
      .sort((a, b) => a.termo.localeCompare(b.termo)));
    this.showModal.set(false);
    this.editingTerm.set(null);
    this.selectedTerm.set(t);
  }

  edit(term: Termo) {
    this.selectedTerm.set(null);
    this.editingTerm.set(term);
  }

  delete(term: Termo) {
    if (!window.confirm(`Excluir o termo “${term.termo}”?`)) return;
    this.glossarioService.delete(this.criancaId(), term.id).subscribe({
      next: () => {
        this.termos.update(items => items.filter(item => item.id !== term.id));
        this.selectedTerm.set(null);
        this.toast.success('Termo excluído.');
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Não foi possível excluir o termo.'),
    });
  }

  private matchesSearch(term: Termo) {
    const query = this.search().trim().toLocaleLowerCase('pt-BR');
    return !query || `${term.termo} ${term.definicao}`.toLocaleLowerCase('pt-BR').includes(query);
  }
}
