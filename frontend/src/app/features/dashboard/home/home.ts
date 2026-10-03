import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CriancaService } from '../../../shared/services/crianca.service';
import { Crianca, PAPEL_LABELS } from '../../../shared/models/crianca.models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule, RouterLink, AvatarComponent, LoadingSpinnerComponent],
  templateUrl: './home.html',
  host: { class: 'flex flex-1 min-h-0 overflow-y-auto' },
})
export class HomeComponent implements OnInit {
  private criancaService = inject(CriancaService);
  private router = inject(Router);

  criancas = signal<Crianca[]>([]);
  search = signal('');
  loading = signal(true);
  papelLabels = PAPEL_LABELS;
  filteredCriancas = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('pt-BR');
    return term
      ? this.criancas().filter(c => c.nome.toLocaleLowerCase('pt-BR').includes(term))
      : this.criancas();
  });

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
