import { Component, input, computed, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { PerfilService, PerfilPublico } from '../../services/perfil.service';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
})
export class AvatarComponent {
  userId = input<string | null>(null);
  profile = signal<PerfilPublico | null>(null);
  profileError = signal(false);
  private profiles = inject(PerfilService);
  @ViewChild('profileDialog') profileDialog?: ElementRef<HTMLDialogElement>;
  openProfile(event: Event) {
    if (!this.userId()) return;
    event.stopPropagation();
    this.profile.set(null);
    this.profileError.set(false);
    this.profileDialog?.nativeElement.showModal();
    this.profiles.getPublic(this.userId()!).subscribe({
      next: p => this.profile.set(p),
      error: () => this.profileError.set(true),
    });
  }
  fotoUrl = input<string | null>(null);
  nome = input.required<string>();
  size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  initials = computed(() => {
    return this.nome()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  });

  sizeClass = computed(() => ({
    xs: 'w-6',
    sm: 'w-8',
    md: 'w-10',
    lg: 'w-14',
    xl: 'w-24',
  })[this.size()]);
}
