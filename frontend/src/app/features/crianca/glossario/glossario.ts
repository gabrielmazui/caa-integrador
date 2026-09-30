import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
export class GlossarioComponent implements OnInit {
  private glossarioService = inject(GlossarioService);
  auth = inject(AuthService);
  private state = inject(CriancaStateService);

  criancaId = () => this.state.current()?.id ?? '';
  criancaNome = () => this.state.current()?.nome ?? '';

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

  ngOnInit() {
    const id = this.criancaId();
    if (!id) return;
    this.glossarioService.list(id).subscribe({
      next: list => { this.termos.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onCreated(t: Termo) {
    this.termos.update(prev => [...prev, t].sort((a, b) => a.termo.localeCompare(b.termo)));
    this.showModal.set(false);
  }
}
