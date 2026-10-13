import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-error-page',
  imports: [RouterLink],
  templateUrl: './error-page.html',
  styleUrl: './error-page.css',
})
export class ErrorPageComponent {
  private auth = inject(AuthService);

  readonly homePath = computed(() => this.auth.isLoggedIn() ? '/home' : '/login');
  readonly homeLabel = computed(() => this.auth.isLoggedIn() ? 'Voltar ao início' : 'Ir para o login');
}
