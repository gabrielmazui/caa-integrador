import { Component, ElementRef, ViewChild, input, signal } from '@angular/core';
import { Anexo } from '../../models/feed.models';

@Component({
  selector: 'app-media-gallery',
  template: `
    @if (items().length) {
      <div class="image-carousel">
        <div class="image-slides" #slides (scroll)="onScroll(slides)">
          @for (item of items(); track item.id; let i = $index) {
            <button type="button" class="image-slide" (click)="open(i)" [attr.aria-label]="'Ampliar imagem ' + (i + 1)">
              <img [src]="item.url" alt="Imagem da publicação" loading="lazy" />
            </button>
          }
        </div>
        @if (items().length > 1) {
          <span class="image-count">{{ index() + 1 }} / {{ items().length }}</span>
          <button type="button" class="gallery-nav gallery-prev" [disabled]="index() === 0" (click)="move(slides, -1)" aria-label="Imagem anterior">‹</button>
          <button type="button" class="gallery-nav gallery-next" [disabled]="index() === items().length - 1" (click)="move(slides, 1)" aria-label="Próxima imagem">›</button>
          <div class="gallery-dots">
            @for (item of items(); track item.id; let i = $index) {
              <button type="button" [class.active]="index() === i" (click)="go(slides, i)" [attr.aria-label]="'Ver imagem ' + (i + 1)"></button>
            }
          </div>
        }
      </div>
      <dialog #viewer class="image-viewer" (click)="backdrop($event)" (close)="opened.set(false)" (keydown.arrowleft)="step(-1)" (keydown.arrowright)="step(1)">
        @if (opened()) {
          <button autofocus type="button" class="viewer-close" (click)="viewer.close()" aria-label="Fechar imagem">✕</button>
          <img [src]="items()[expanded()].url" alt="Imagem ampliada" />
          @if (items().length > 1) {
            <button type="button" class="gallery-nav gallery-prev" [disabled]="expanded() === 0" (click)="step(-1)" aria-label="Imagem anterior">‹</button>
            <button type="button" class="gallery-nav gallery-next" [disabled]="expanded() === items().length - 1" (click)="step(1)" aria-label="Próxima imagem">›</button>
            <span class="viewer-count">{{ expanded() + 1 }} / {{ items().length }}</span>
          }
        }
      </dialog>
    }
  `,
})
export class MediaGalleryComponent {
  items = input.required<Anexo[]>();
  index = signal(0);
  expanded = signal(0);
  opened = signal(false);
  @ViewChild('viewer') viewer?: ElementRef<HTMLDialogElement>;
  onScroll(el: HTMLElement) { this.index.set(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))); }
  go(el: HTMLElement, index: number) {
    el.scrollTo({ left: el.clientWidth * index, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  move(el: HTMLElement, delta: number) { this.go(el, this.index() + delta); }
  open(index: number) { this.expanded.set(index); this.opened.set(true); this.viewer?.nativeElement.showModal(); }
  step(delta: number) { this.expanded.update(i => Math.max(0, Math.min(this.items().length - 1, i + delta))); }
  backdrop(event: MouseEvent) { if (event.target === this.viewer?.nativeElement) this.viewer.nativeElement.close(); }
}
