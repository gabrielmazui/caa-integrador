import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CriancaService } from '../../shared/services/crianca.service';
import { Crianca } from '../../shared/models/crianca.models';
import { AvatarComponent } from '../../shared/components/avatar/avatar';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './dashboard-shell.html',
})
export class DashboardShellComponent implements OnInit {
  auth = inject(AuthService);
  private criancaService = inject(CriancaService);

  criancas = signal<Crianca[]>([]);
  isProfissional = this.auth.isProfissional;

  // Profissionais start with sidebar open; familiares start collapsed
  sidebarOpen = signal(this.auth.isProfissional());

  ngOnInit() {
    this.criancaService.list().subscribe(list => this.criancas.set(list));
  }

  logout() {
    this.auth.logout();
  }
}
