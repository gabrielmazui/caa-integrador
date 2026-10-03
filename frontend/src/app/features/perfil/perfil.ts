import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PerfilService, PerfilUsuario } from '../../shared/services/perfil.service';
import { AuthService } from '../../core/auth/auth.service';
import { UploadService } from '../../shared/services/upload.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { ToastService } from '../../shared/services/toast.service';
import { ESPECIALIDADES_PROFISSIONAIS } from '../../shared/models/auth.models';

@Component({
  imports: [FormsModule, AvatarComponent, LoadingSpinnerComponent],
  templateUrl: './perfil.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class PerfilComponent implements OnInit {
  private perfilService = inject(PerfilService);
  auth = inject(AuthService);
  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  perfil = signal<PerfilUsuario | null>(null);
  loading = signal(true);
  saving = signal(false);
  uploadingFoto = signal(false);
  saved = signal(false);
  submitted = signal(false);

  nome = signal('');
  bio = signal('');
  telefone = signal('');
  especialidadeSelecionada = signal('');
  outraEspecialidade = signal('');
  especialidades = ESPECIALIDADES_PROFISSIONAIS;
  fotoUrl = signal<string | null>(null);

  ngOnInit() {
    this.perfilService.get().subscribe({
      next: p => {
        this.perfil.set(p);
        this.nome.set(p.nome);
        this.bio.set(p.bio ?? '');
        this.telefone.set(p.telefone ?? '');
        if (p.especialidade && this.especialidades.some(item => item === p.especialidade)) {
          this.especialidadeSelecionada.set(p.especialidade);
        } else if (p.especialidade) {
          this.especialidadeSelecionada.set('outro');
          this.outraEspecialidade.set(p.especialidade);
        }
        this.fotoUrl.set(p.fotoUrl);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
    const especialidade = this.especialidadeSelecionada() === 'outro'
      ? this.outraEspecialidade().trim()
      : this.especialidadeSelecionada();
    if (!this.nome().trim() || (this.perfil()?.tipoUsuario === 'profissional' && !especialidade)) return;
    this.saving.set(true);
    this.perfilService.update({
      nome: this.nome(),
      bio: this.bio(),
      telefone: this.telefone(),
      especialidade,
      fotoUrl: this.fotoUrl() ?? undefined,
    }).subscribe({
      next: p => {
        this.perfil.set(p);
        this.auth.refreshUser(p);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Erro ao salvar perfil. Tente novamente.');
        this.saving.set(false);
      },
    });
  }
}
