import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Arquivo } from '../models/feed.models';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/upload`;

  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Arquivo>(this.url, form);
  }
}
