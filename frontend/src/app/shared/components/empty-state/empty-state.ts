import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
})
export class EmptyStateComponent {
  titulo = input.required<string>();
  descricao = input<string>('');
  ctaLabel = input<string>('');
  cta = output<void>();
}
