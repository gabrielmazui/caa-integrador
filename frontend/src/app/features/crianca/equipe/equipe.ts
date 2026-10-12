import { Component, inject, signal, computed } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs';
import {
  Membro, PAPEL_LABELS, RELACAO_RESPONSAVEL_LABELS,
} from '../../../shared/models/crianca.models';
import { CriancaService } from '../../../shared/services/crianca.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CriancaStateService } from '../crianca-state.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { InviteMemberComponent } from './invite-member/invite-member';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule, AvatarComponent, InviteMemberComponent, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './equipe.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class EquipeComponent {
  private criancaService = inject(CriancaService);
  private state = inject(CriancaStateService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  crianca = this.state.current;
  criancaId = computed(() => this.crianca()?.id ?? '');
  membros = signal<Membro[]>([]);
  loading = signal(true);
  showModal = signal(false);
  showLeaveModal = signal(false);
  leaving = signal(false);
  novoCoordenadorId = signal('');
  papelLabels = PAPEL_LABELS;
  relacaoLabels = RELACAO_RESPONSAVEL_LABELS;
  currentUserId = computed(() => this.auth.currentUser()?.id ?? '');
  currentMember = computed(() => this.membros().find(m => m.id === this.currentUserId()) ?? null);
  otherMembers = computed(() => this.membros().filter(m => m.id !== this.currentUserId()));
  coordinatorCandidates = computed(() => this.otherMembers());
  currentIsCoordinator = computed(() => this.currentMember()?.coordenador === true);

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
    this.membros.update(prev => [...prev.filter(item => item.id !== m.id), m]);
    this.showModal.set(false);
  }

  removeMember(membro: Membro) {
    if (!window.confirm(`Remover ${membro.nome} da equipe desta criança?`)) return;
    this.criancaService.removeMember(this.criancaId(), membro.id).subscribe({
      next: () => {
        this.membros.update(prev => prev.filter(item => item.id !== membro.id));
        this.toast.success('Membro removido da equipe.');
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Não foi possível remover o membro.'),
    });
  }

  startLeave() {
    this.novoCoordenadorId.set('');
    this.showLeaveModal.set(true);
  }

  leaveChild() {
    if (this.currentIsCoordinator() && this.otherMembers().length > 0
      && !this.novoCoordenadorId()) return;
    this.leaving.set(true);
    this.criancaService.leaveChild(this.criancaId(), {
      novoCoordenadorId: this.novoCoordenadorId() || undefined,
      confirmarExclusao: this.otherMembers().length === 0,
    }).subscribe({
      next: () => {
        this.state.clear();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Não foi possível sair desta criança.');
        this.leaving.set(false);
      },
    });
  }
}
