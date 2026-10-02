import { Component, inject, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CriancaStateService } from './crianca-state.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './crianca-shell.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' },
})
export class CriancaShellComponent {
  auth = inject(AuthService);
  private state = inject(CriancaStateService);

  crianca = this.state.current;

  age = computed(() => {
    const d = this.crianca()?.dataNascimento;
    if (!d) return null;
    const diff = Date.now() - new Date(d).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  });

  constructor() {
    inject(ActivatedRoute).data.pipe(takeUntilDestroyed()).subscribe(data => {
      if (data['crianca']) this.state.set(data['crianca']);
    });
  }
}
