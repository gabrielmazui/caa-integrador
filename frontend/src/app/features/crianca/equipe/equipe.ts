import { Component, inject, signal, computed } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs';
import { Membro, PAPEL_LABELS } from '../../../shared/models/crianca.models';
import { CriancaService } from '../../../shared/services/crianca.service';
import { CriancaStateService } from '../crianca-state.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { InviteMemberComponent } from './invite-member/invite-member';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  imports: [AvatarComponent, InviteMemberComponent, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './equipe.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class EquipeComponent {
  private criancaService = inject(CriancaService);
  private state = inject(CriancaStateService);

  crianca = this.state.current;
  criancaId = computed(() => this.crianca()?.id ?? '');
  membros = signal<Membro[]>([]);
  loading = signal(true);
  showModal = signal(false);
  papelLabels = PAPEL_LABELS;

  constructor() {
    toObservable(this.criancaId).pipe(
      distinctUntilChanged(),
      filter(id => !!id),
      takeUntilDestroyed(),
    ).subscribe(id => {
      this.membros.set([]);
      this.loading.set(true);
      this.criancaService.getMembers(id).subscribe({
        next: list => { this.membros.set(list); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  onMemberAdded(m: Membro) {
    this.membros.update(prev => [...prev, m]);
    this.showModal.set(false);
  }
}
