import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { Comentario, Registro } from '../../../../shared/models/feed.models';
import { Crianca } from '../../../../shared/models/crianca.models';
import { FeedService } from '../../../../shared/services/feed.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar';
import { RelativeTimePipe } from '../../../../shared/components/relative-time.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-detail',
  imports: [AvatarComponent, RelativeTimePipe, FormsModule],
  templateUrl: './post-detail.html',
})
export class PostDetailComponent implements OnInit {
  registro = input.required<Registro>();
  crianca = input.required<Crianca>();
  close = output<void>();
  commented = output<Comentario>();

  private feedService = inject(FeedService);
  auth = inject(AuthService);

  comments = signal<Comentario[]>([]);
  loading = signal(true);
  newComment = signal('');
  sending = signal(false);

  ngOnInit() {
    this.feedService.getComentarios(this.crianca().id, this.registro().id).subscribe({
      next: list => { this.comments.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submitComment() {
    const text = this.newComment().trim();
    if (!text) return;
    this.sending.set(true);
    this.feedService.addComentario(this.crianca().id, this.registro().id, { conteudo: text }).subscribe({
      next: (c) => {
        this.comments.update(list => [...list, c]);
        this.newComment.set('');
        this.sending.set(false);
        this.commented.emit(c);
      },
      error: () => this.sending.set(false),
    });
  }
}
