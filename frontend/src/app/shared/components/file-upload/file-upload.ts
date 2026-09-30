import { Component, input, output, signal } from '@angular/core';
import { Arquivo } from '../../models/feed.models';
import { UploadService } from '../../services/upload.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.html',
})
export class FileUploadComponent {
  label = input('Anexar arquivo');
  accept = input('*/*');
  multiple = input(true);

  uploaded = output<Arquivo>();

  private uploadService = inject(UploadService);
  uploading = signal(false);
  error = signal<string | null>(null);

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    input.value = '';
    this.error.set(null);
    this.uploading.set(true);
    let done = 0;
    for (const file of files) {
      this.uploadService.upload(file).subscribe({
        next: (arquivo) => {
          this.uploaded.emit(arquivo);
          done++;
          if (done === files.length) this.uploading.set(false);
        },
        error: () => {
          this.error.set('Erro ao enviar ' + file.name);
          done++;
          if (done === files.length) this.uploading.set(false);
        },
      });
    }
  }
}
