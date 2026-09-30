import { Component, computed, input, output } from '@angular/core';
import { Anexo, Registro } from '../../../../shared/models/feed.models';
import { Crianca } from '../../../../shared/models/crianca.models';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar';
import { RelativeTimePipe } from '../../../../shared/components/relative-time.pipe';

@Component({
  selector: 'app-post-card',
  imports: [AvatarComponent, RelativeTimePipe],
  templateUrl: './post-card.html',
})
export class PostCardComponent {
  registro = input.required<Registro>();
  crianca = input.required<Crianca>();
  openDetail = output<Registro>();

  images = computed(() => (this.registro().anexos ?? []).filter(a => a.tipo === 'imagem'));
  audios = computed(() => (this.registro().anexos ?? []).filter(a => a.tipo === 'audio'));
  videos = computed(() => (this.registro().anexos ?? []).filter(a => a.tipo === 'video'));
  docs = computed(() => (this.registro().anexos ?? []).filter(a => a.tipo === 'documento' || a.tipo === 'outro'));
  hasAttachments = computed(() => (this.registro().anexos?.length ?? 0) > 0);
}
