import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Membro, AddMemberRequest, PAPEL_LABELS, Papel } from '../../../../shared/models/crianca.models';
import { CriancaService } from '../../../../shared/services/crianca.service';

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

  email = signal('');
  papel = signal<Papel>('professor');
  descricaoFuncao = signal('');
  error = signal('');
  loading = signal(false);

  papeis = Object.entries(PAPEL_LABELS) as [Papel, string][];

  submit() {
    if (!this.email().trim()) return;
    this.error.set('');
    this.loading.set(true);
    const req: AddMemberRequest = {
      email: this.email(),
      papel: this.papel(),
      descricaoFuncao: this.descricaoFuncao() || undefined,
    };
    this.criancaService.addMember(this.criancaId(), req).subscribe({
      next: (m) => { this.created.emit(m); this.loading.set(false); },
      error: (err) => { this.error.set(err.error?.message ?? 'Erro ao convidar.'); this.loading.set(false); },
    });
  }
}
