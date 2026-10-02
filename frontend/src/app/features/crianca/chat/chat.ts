import { Component, inject, signal, computed, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs';
import { Mensagem } from '../../../shared/models/chat.models';
import { ChatService } from '../../../shared/services/chat.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CriancaStateService } from '../crianca-state.service';
import { RelativeTimePipe } from '../../../shared/components/relative-time.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  imports: [FormsModule, RelativeTimePipe, LoadingSpinnerComponent],
  templateUrl: './chat.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messageList') messageList?: ElementRef<HTMLDivElement>;

  private chatService = inject(ChatService);
  auth = inject(AuthService);
  private state = inject(CriancaStateService);

  crianca = this.state.current;
  criancaId = computed(() => this.crianca()?.id ?? '');

  mensagens = signal<Mensagem[]>([]);
  loading = signal(true);
  newMessage = signal('');
  sending = signal(false);
  private shouldScroll = false;

  constructor() {
    toObservable(this.criancaId).pipe(
      distinctUntilChanged(),
      filter(id => !!id),
      takeUntilDestroyed(),
    ).subscribe(id => {
      this.mensagens.set([]);
      this.loading.set(true);
      this.chatService.list(id, 50).subscribe({
        next: items => {
          this.mensagens.set([...items].reverse());
          this.loading.set(false);
          this.shouldScroll = true;
        },
        error: () => this.loading.set(false),
      });
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
    if (!id || !text) return;
    this.sending.set(true);
    this.chatService.send(id, { conteudo: text }).subscribe({
      next: (m) => {
        this.mensagens.update(prev => [...prev, m]);
        this.newMessage.set('');
        this.sending.set(false);
        this.shouldScroll = true;
      },
      error: () => this.sending.set(false),
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
