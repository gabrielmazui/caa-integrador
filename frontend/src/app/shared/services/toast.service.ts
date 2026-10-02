import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = this.nextId++;
    this.toasts.update(ts => [...ts, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  error(message: string) { this.show(message, 'error'); }
  success(message: string) { this.show(message, 'success'); }

  dismiss(id: number) {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }
}
