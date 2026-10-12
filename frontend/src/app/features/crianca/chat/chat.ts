import { Component, inject, signal, computed, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs';
import { Mensagem } from '../../../shared/models/chat.models';
import { ChatService } from '../../../shared/services/chat.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CriancaStateService } from '../crianca-state.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { Arquivo, Anexo } from '../../../shared/models/feed.models';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload';
import { MediaCaptureComponent } from '../../../shared/components/media-capture/media-capture';
import { MediaPlayerComponent } from '../../../shared/components/media-player/media-player';
import { MediaGalleryComponent } from '../../../shared/components/media-gallery/media-gallery';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  imports: [FormsModule, LoadingSpinnerComponent, FileUploadComponent, MediaCaptureComponent, MediaPlayerComponent, MediaGalleryComponent, AvatarComponent],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messageList') messageList?: ElementRef<HTMLDivElement>;
  @ViewChild('composer') composer?: ElementRef<HTMLTextAreaElement>;

  private chatService = inject(ChatService);
  auth = inject(AuthService);
  private state = inject(CriancaStateService);

  crianca = this.state.current;
  criancaId = computed(() => this.crianca()?.id ?? '');

  mensagens = signal<Mensagem[]>([]);
  loading = signal(true);
  newMessage = signal('');
  sending = signal(false);
  attachments = signal<Arquivo[]>([]);
  uploading = signal(false);
  capturing = signal(false);
  showTools = signal(false);
  loadError = signal(false);
  private timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
  private dateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  timeLabel(date: string) { return this.timeFormat.format(new Date(date)); }
  dayLabel(date: string) {
    const day = new Date(date);
    const today = new Date();
    if (day.toDateString() === today.toDateString()) return 'Hoje';
    today.setDate(today.getDate() - 1);
    if (day.toDateString() === today.toDateString()) return 'Ontem';
    return this.dateFormat.format(day);
  }
  startsDay(index: number) {
    const items = this.mensagens();
    return index === 0 || new Date(items[index].criadoEm).toDateString() !== new Date(items[index - 1].criadoEm).toDateString();
  }
  sameSender(index: number) {
    if (this.startsDay(index)) return false;
    const items = this.mensagens();
    return items[index].remetenteId === items[index - 1].remetenteId &&
      new Date(items[index].criadoEm).getTime() - new Date(items[index - 1].criadoEm).getTime() < 300000;
  }
  resizeComposer(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 144) + 'px';
  }
  private toast = inject(ToastService);
  images(items: Anexo[] = []) { return items.filter(a => a.tipo === 'imagem'); }
  addAttachment(file: Arquivo) {
    if (this.attachments().length >= 5) { this.toast.error('Máximo de 5 anexos por mensagem.'); return; }
    this.attachments.update(items => [...items, file]);
  }
  removeAttachment(id: string) { this.attachments.update(items => items.filter(a => a.id !== id)); }
  private shouldScroll = false;

  constructor() {
    toObservable(this.criancaId).pipe(
      distinctUntilChanged(),
      filter(id => !!id),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.newMessage.set('');
      this.attachments.set([]);
      this.showTools.set(false);
      this.loadMessages();
    });
  }

  loadMessages() {
      const id = this.criancaId();
      this.loadError.set(false);
      this.mensagens.set([]);
      this.loading.set(true);
      this.chatService.list(id, 50).subscribe({
        next: items => {
          if (this.criancaId() !== id) return;
          this.mensagens.set([...items].reverse());
          this.loading.set(false);
          this.shouldScroll = true;
        },
        error: () => { if (this.criancaId() === id) { this.loading.set(false); this.loadError.set(true); } },
      });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    const el = this.messageList?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  isOwn(m: Mensagem): boolean {
    return m.remetenteId === this.auth.currentUser()?.id;
  }

  send() {
    const id = this.criancaId();
    const text = this.newMessage().trim();
    if (!id || this.sending() || this.uploading() || this.capturing() || (!text && !this.attachments().length)) return;
    this.sending.set(true);
    this.chatService.send(id, { conteudo: text, arquivoIds: this.attachments().map(a => a.id) }).subscribe({
      next: (m) => {
        this.sending.set(false);
        if (this.criancaId() !== id) return;
        this.mensagens.update(prev => [...prev, m]);
        this.newMessage.set('');
        this.attachments.set([]);
        this.sending.set(false);
        this.shouldScroll = true;
        if (this.composer) this.composer.nativeElement.style.height = 'auto';
      },
      error: () => { this.sending.set(false); this.toast.error('Não foi possível enviar. Sua mensagem foi mantida para tentar novamente.'); },
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.send();
    }
  }
}
