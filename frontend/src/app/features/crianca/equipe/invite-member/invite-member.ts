import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Membro, AddMemberRequest, PAPEL_LABELS, Papel,
  RELACAO_RESPONSAVEL_LABELS, RelacaoResponsavel,
} from '../../../../shared/models/crianca.models';
import { CriancaService } from '../../../../shared/services/crianca.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-invite-member',
  imports: [FormsModule],
  templateUrl: './invite-member.html',
})
export class InviteMemberComponent {
  criancaId = input.required<string>();
  created = output<Membro>();
  close = output<void>();

  private criancaService = inject(CriancaService);
  private toast = inject(ToastService);

  email = signal('');
  papel = signal<Papel>('responsavel');
  relacaoResponsavel = signal<RelacaoResponsavel | ''>('');
  descricaoRelacao = signal('');
  loading = signal(false);
  submitted = signal(false);

  papeis = Object.entries(PAPEL_LABELS) as [Papel, string][];
  relacoes = Object.entries(RELACAO_RESPONSAVEL_LABELS) as [RelacaoResponsavel, string][];

  submit() {
    this.submitted.set(true);
    if (!this.email().trim()
      || (this.relacaoResponsavel() === 'outro' && !this.descricaoRelacao().trim())) return;
    this.loading.set(true);
    const req: AddMemberRequest = {
      email: this.email(),
      papel: this.papel(),
      ...(this.papel() === 'responsavel' && {
        relacaoResponsavel: this.relacaoResponsavel() || undefined,
        descricaoRelacao: this.relacaoResponsavel() === 'outro'
          ? this.descricaoRelacao() || undefined
          : undefined,
      }),
    };
    this.criancaService.addMember(this.criancaId(), req).subscribe({
      next: (m) => { this.created.emit(m); this.loading.set(false); },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Erro ao convidar. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
