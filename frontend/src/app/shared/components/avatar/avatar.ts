import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
})
export class AvatarComponent {
  fotoUrl = input<string | null>(null);
  nome = input.required<string>();
  size = input<'xs' | 'sm' | 'md' | 'lg'>('md');

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
  })[this.size()]);
}
