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

@Component({
  imports: [FormsModule, NewTermoComponent, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './glossario.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class GlossarioComponent {
  private glossarioService = inject(GlossarioService);
  auth = inject(AuthService);
  private state = inject(CriancaStateService);

  crianca = this.state.current;
  criancaId = computed(() => this.crianca()?.id ?? '');
  criancaNome = computed(() => this.crianca()?.nome ?? '');

  termos = signal<Termo[]>([]);
  loading = signal(true);
  showModal = signal(false);
  search = signal('');

  global = computed(() =>
    this.termos().filter(t => t.global && t.termo.toLowerCase().includes(this.search().toLowerCase()))
  );
  especificos = computed(() =>
    this.termos().filter(t => !t.global && t.termo.toLowerCase().includes(this.search().toLowerCase()))
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

  onCreated(t: Termo) {
    this.termos.update(prev => [...prev, t].sort((a, b) => a.termo.localeCompare(b.termo)));
    this.showModal.set(false);
  }
}
