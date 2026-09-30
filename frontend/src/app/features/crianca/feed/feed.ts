import { Component, inject, signal, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Arquivo, Registro, Visibilidade } from '../../../shared/models/feed.models';
import { FeedService } from '../../../shared/services/feed.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CriancaStateService } from '../crianca-state.service';
import { PostCardComponent } from './post-card/post-card';
import { PostDetailComponent } from './post-detail/post-detail';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload';

@Component({
  imports: [FormsModule, PostCardComponent, PostDetailComponent, EmptyStateComponent, LoadingSpinnerComponent, AvatarComponent, FileUploadComponent],
  templateUrl: './feed.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class FeedComponent implements OnInit, AfterViewInit {
  private feedService = inject(FeedService);
  auth = inject(AuthService);
  private state = inject(CriancaStateService);
  private el = inject(ElementRef);

  crianca = this.state.current;
  registros = signal<Registro[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  offset = signal(0);
  readonly limit = 20;

  newContent = signal('');
  newVisibilidade = signal<Visibilidade>('todos');
  posting = signal(false);
  selectedPost = signal<Registro | null>(null);
  attachments = signal<Arquivo[]>([]);

  private observer?: IntersectionObserver;

  ngOnInit() {
    this.loadFeed();
  }

  ngAfterViewInit() {
    const sentinel = this.el.nativeElement.querySelector('#scroll-sentinel');
    if (!sentinel) return;
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && this.hasMore() && !this.loadingMore()) {
        this.loadMore();
      }
    }, { threshold: 0.1 });
    this.observer.observe(sentinel);
  }

  loadFeed() {
    const id = this.crianca()?.id;
    if (!id) return;
    this.loading.set(true);
    this.feedService.list(id, this.limit, 0).subscribe({
      next: items => {
        this.registros.set(items);
        this.offset.set(items.length);
        this.hasMore.set(items.length === this.limit);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore() {
    const id = this.crianca()?.id;
    if (!id || !this.hasMore() || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.feedService.list(id, this.limit, this.offset()).subscribe({
      next: items => {
        this.registros.update(prev => [...prev, ...items]);
        this.offset.update(o => o + items.length);
        this.hasMore.set(items.length === this.limit);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  onAttachmentUploaded(arquivo: Arquivo) {
    this.attachments.update(list => [...list, arquivo]);
  }

  removeAttachment(id: string) {
    this.attachments.update(list => list.filter(a => a.id !== id));
  }

  onCommented(registroId: string) {
    this.registros.update(list =>
      list.map(r => r.id === registroId ? { ...r, totalComentarios: r.totalComentarios + 1 } : r)
    );
  }

  post() {
    const id = this.crianca()?.id;
    const text = this.newContent().trim();
    if (!id || !text) return;
    this.posting.set(true);
    this.feedService.create(id, {
      conteudo: text,
      visibilidade: this.newVisibilidade(),
      arquivoIds: this.attachments().map(a => a.id),
    }).subscribe({
      next: (r) => {
        this.registros.update(prev => [r, ...prev]);
        this.newContent.set('');
        this.attachments.set([]);
        this.posting.set(false);
      },
      error: () => this.posting.set(false),
    });
  }
}
