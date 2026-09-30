import { Component, input, output } from '@angular/core';
import { Registro } from '../../../../shared/models/feed.models';
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
}
