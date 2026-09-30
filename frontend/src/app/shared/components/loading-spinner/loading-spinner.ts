import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg text-primary" role="status" aria-label="Carregando..."></span>
    </div>
  `,
})
export class LoadingSpinnerComponent {}
