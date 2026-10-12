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
  maxFiles = input(5);
  maxBytes = input(50 * 1024 * 1024);
  disabled = input(false);
  busy = output<boolean>();

  uploaded = output<Arquivo>();

  private uploadService = inject(UploadService);
  uploading = signal(false);
  error = signal<string | null>(null);

  onFilesSelected(event: Event) {
    if (this.disabled() || this.uploading()) return;
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    input.value = '';
    if (files.length > this.maxFiles() || files.some(f => f.size > this.maxBytes())) {
      this.error.set('Limite de ' + this.maxFiles() + ' arquivos, até 50 MB cada.');
      return;
    }
    this.error.set(null);
    this.uploading.set(true);
    this.busy.emit(true);
    let done = 0;
    for (const file of files) {
      this.uploadService.upload(file).subscribe({
        next: (arquivo) => {
          this.uploaded.emit(arquivo);
          done++;
          if (done === files.length) { this.uploading.set(false); this.busy.emit(false); }
        },
        error: () => {
          this.error.set('Erro ao enviar ' + file.name);
          done++;
          if (done === files.length) { this.uploading.set(false); this.busy.emit(false); }
        },
      });
    }
  }
}
