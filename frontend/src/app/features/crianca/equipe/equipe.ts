import { Component, inject, signal, OnInit } from '@angular/core';
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
export class EquipeComponent implements OnInit {
  private criancaService = inject(CriancaService);
  private state = inject(CriancaStateService);

  crianca = this.state.current;
  membros = signal<Membro[]>([]);
  loading = signal(true);
  showModal = signal(false);
  papelLabels = PAPEL_LABELS;

  ngOnInit() {
    const id = this.crianca()?.id;
    if (!id) return;
    this.criancaService.getMembers(id).subscribe({
      next: list => { this.membros.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onMemberAdded(m: Membro) {
    this.membros.update(prev => [...prev, m]);
    this.showModal.set(false);
  }
}
