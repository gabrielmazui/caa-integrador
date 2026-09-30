import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relativeTime', pure: true })
export class RelativeTimePipe implements PipeTransform {
  private fmt = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  transform(value: string | null | undefined): string {
    if (!value) return '';
    const diffMs = new Date(value).getTime() - Date.now();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);

    if (Math.abs(diffSec) < 60) return this.fmt.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return this.fmt.format(diffMin, 'minute');
    if (Math.abs(diffHr) < 24) return this.fmt.format(diffHr, 'hour');
    return this.fmt.format(diffDay, 'day');
  }
}
