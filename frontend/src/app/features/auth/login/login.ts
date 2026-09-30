import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  senha = signal('');
  error = signal('');
  loading = signal(false);

  submit() {
    this.error.set('');
    this.loading.set(true);
    this.auth.login({ email: this.email(), senha: this.senha() }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'E-mail ou senha inválidos.');
        this.loading.set(false);
      },
    });
  }
}
