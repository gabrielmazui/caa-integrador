import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CriancaService } from '../../../shared/services/crianca.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Crianca, PAPEL_LABELS } from '../../../shared/models/crianca.models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { Router } from '@angular/router';

@Component({
  imports: [RouterLink, AvatarComponent, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './home.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class HomeComponent implements OnInit {
  private criancaService = inject(CriancaService);
  auth = inject(AuthService);
  private router = inject(Router);

  criancas = signal<Crianca[]>([]);
  loading = signal(true);
  papelLabels = PAPEL_LABELS;

  ngOnInit() {
    this.criancaService.list().subscribe({
      next: list => { this.criancas.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  calcAge(dataNascimento: string | null): string {
    if (!dataNascimento) return '';
    const diff = Date.now() - new Date(dataNascimento).getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} anos`;
  }

  goToNovaCrianca() {
    this.router.navigate(['/home/nova-crianca']);
  }
}
