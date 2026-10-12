import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CriancaStateService } from '../crianca-state.service';
import { CriancaService } from '../../../shared/services/crianca.service';
import { UploadService } from '../../../shared/services/upload.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { ToastService } from '../../../shared/services/toast.service';
import { RELACAO_RESPONSAVEL_LABELS, RelacaoResponsavel } from '../../../shared/models/crianca.models';

@Component({
  imports: [FormsModule, AvatarComponent],
  templateUrl: './crianca-perfil.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class CriancaPerfilComponent implements OnInit {
  private state = inject(CriancaStateService);
  private criancaService = inject(CriancaService);
  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  crianca = this.state.current;
  saving = signal(false);
  uploadingFoto = signal(false);
  saved = signal(false);
  submitted = signal(false);

  nome = signal('');
  dataNascimento = signal('');
  fotoUrl = signal<string | null>(null);
  diagnostico = signal('');
  cid10 = signal('');
  observacoes = signal('');
  relacaoResponsavel = signal<RelacaoResponsavel | ''>('');
  descricaoRelacao = signal('');
  savingRelationship = signal(false);
  relationshipSaved = signal(false);
  relationshipSubmitted = signal(false);
  relacoes = Object.entries(RELACAO_RESPONSAVEL_LABELS) as [RelacaoResponsavel, string][];

  ngOnInit() {
    const c = this.crianca();
    if (!c) return;
    this.nome.set(c.nome);
    this.dataNascimento.set(c.dataNascimento ?? '');
    this.fotoUrl.set(c.fotoUrl);
    this.diagnostico.set(c.diagnostico ?? '');
    this.cid10.set(c.cid10 ?? '');
    this.observacoes.set(c.observacoes ?? '');
    this.relacaoResponsavel.set(c.relacaoResponsavel ?? '');
    this.descricaoRelacao.set(c.descricaoRelacao ?? '');
  }

  onFotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingFoto.set(true);
    this.uploadService.upload(file).subscribe({
      next: a => { this.fotoUrl.set(a.url); this.uploadingFoto.set(false); },
      error: () => { this.toast.error('Erro ao enviar foto.'); this.uploadingFoto.set(false); },
    });
  }

  save() {
    this.submitted.set(true);
    const c = this.crianca();
    if (!c || !this.nome().trim()) return;
    this.saving.set(true);
    this.criancaService.update(c.id, {
      nome: this.nome(),
      dataNascimento: this.dataNascimento() || undefined,
      fotoUrl: this.fotoUrl() ?? undefined,
      diagnostico: this.diagnostico() || undefined,
      cid10: this.cid10() || undefined,
      observacoes: this.observacoes() || undefined,
    }).subscribe({
      next: updated => {
        this.state.set(updated);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Erro ao salvar. Tente novamente.');
        this.saving.set(false);
      },
    });
  }

  saveMyRelationship() {
    this.relationshipSubmitted.set(true);
    const c = this.crianca();
    if (!c || c.papel !== 'responsavel'
      || (this.relacaoResponsavel() === 'outro' && !this.descricaoRelacao().trim())) return;
    this.savingRelationship.set(true);
    this.criancaService.updateMyRelationship(c.id, {
      relacaoResponsavel: this.relacaoResponsavel() || undefined,
      descricaoRelacao: this.relacaoResponsavel() === 'outro'
        ? this.descricaoRelacao() || undefined
        : undefined,
    }).subscribe({
      next: updated => {
        this.state.set(updated);
        this.savingRelationship.set(false);
        this.relationshipSaved.set(true);
        setTimeout(() => this.relationshipSaved.set(false), 3000);
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Erro ao salvar seu vínculo.');
        this.savingRelationship.set(false);
      },
    });
  }
}
