import { Injectable, signal } from '@angular/core';
import { Crianca } from '../../shared/models/crianca.models';

@Injectable({ providedIn: 'root' })
export class CriancaStateService {
  readonly current = signal<Crianca | null>(null);

  set(c: Crianca) {
    this.current.set(c);
  }
}
