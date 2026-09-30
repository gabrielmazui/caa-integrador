import { Component, inject, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CriancaStateService } from './crianca-state.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './crianca-shell.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' },
})
export class CriancaShellComponent implements OnInit {
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private state = inject(CriancaStateService);

  crianca = this.state.current;

  age = computed(() => {
    const d = this.crianca()?.dataNascimento;
    if (!d) return null;
    const diff = Date.now() - new Date(d).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  });

  ngOnInit() {
    const resolved = this.route.snapshot.data['crianca'];
    if (resolved) this.state.set(resolved);
  }
}
