import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CriancaService } from '../../shared/services/crianca.service';
import { CriancaStateService } from '../crianca/crianca-state.service';
import { Crianca } from '../../shared/models/crianca.models';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import { ToastComponent } from '../../shared/components/toast/toast';

@Component({
  imports: [FormsModule, RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent, ToastComponent],
  templateUrl: './dashboard-shell.html',
})
export class DashboardShellComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private criancaService = inject(CriancaService);
  private criancaState = inject(CriancaStateService);

  criancas = signal<Crianca[]>([]);
  childSearch = signal('');
  isProfissional = this.auth.isProfissional;
  criancaAtual = this.criancaState.current;

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isOnCriancaPage = computed(() => this.currentUrl().includes('/crianca/'));

  readonly filteredCriancas = computed(() => {
    const q = this.childSearch().toLowerCase().trim();
    return q ? this.criancas().filter(c => c.nome.toLowerCase().includes(q)) : this.criancas();
  });

  ngOnInit() {
    this.criancaService.list().subscribe(list => this.criancas.set(list));
  }

  closeDropdown() {
    (document.activeElement as HTMLElement)?.blur();
  }

  logout() {
    this.auth.logout();
  }
}
