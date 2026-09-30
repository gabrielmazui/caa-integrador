import { Component, ElementRef, ViewChild, inject, signal, computed, output, OnDestroy } from '@angular/core';
import { UploadService } from '../../services/upload.service';
import { Arquivo } from '../../models/feed.models';

type CaptureMode = 'audio' | 'video' | 'photo';
type CapturePhase = 'requesting' | 'ready' | 'recording' | 'preview' | 'uploading';

@Component({
  selector: 'app-media-capture',
  templateUrl: './media-capture.html',
})
export class MediaCaptureComponent implements OnDestroy {
  private uploadService = inject(UploadService);

  uploaded = output<Arquivo>();

  mode = signal<CaptureMode | null>(null);
  phase = signal<CapturePhase>('requesting');
  duration = signal(0);
  errorMsg = signal<string | null>(null);

  showVideo = computed(() => {
    const m = this.mode();
    const p = this.phase();
    return (m === 'video' || m === 'photo') && p !== 'requesting' && p !== 'uploading' && !(m === 'photo' && p === 'preview');
  });

  @ViewChild('videoPreview') videoPreview?: ElementRef<HTMLVideoElement>;
  @ViewChild('photoCanvas') photoCanvas?: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private photoBlob: Blob | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  async open(captureMode: CaptureMode) {
    this.errorMsg.set(null);
    this.chunks = [];
    this.photoBlob = null;
    this.mode.set(captureMode);
    this.phase.set('requesting');
    try {
      const constraints: MediaStreamConstraints =
        captureMode === 'audio'
          ? { audio: true }
          : { video: { facingMode: 'environment' }, audio: captureMode === 'video' };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.phase.set('ready');
      if (captureMode !== 'audio') {
        setTimeout(() => {
          const v = this.videoPreview?.nativeElement;
          if (v && this.stream) {
            v.srcObject = this.stream;
            v.play().catch(() => {});
          }
        }, 0);
      }
    } catch {
      this.errorMsg.set(captureMode === 'audio' ? 'Permissão negada para o microfone' : 'Permissão negada para a câmera');
      this.phase.set('ready');
    }
  }

  startRecording() {
    if (!this.stream) return;
    this.chunks = [];
    const isAudio = this.mode() === 'audio';
    const preferred = isAudio ? ['audio/webm', 'audio/ogg', 'audio/mp4'] : ['video/webm', 'video/mp4'];
    const mimeType = preferred.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : {});
    this.recorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data); };
    this.recorder.onstop = () => this.onRecordingStop();
    this.recorder.start(100);
    this.phase.set('recording');
    this.duration.set(0);
    this.timerInterval = setInterval(() => this.duration.update(d => d + 1), 1000);
  }

  stopRecording() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    this.recorder?.stop();
  }

  private onRecordingStop() {
    const isAudio = this.mode() === 'audio';
    const mimeType = this.recorder?.mimeType ?? (isAudio ? 'audio/webm' : 'video/webm');
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const name = `${isAudio ? 'audio' : 'video'}_${Date.now()}.${ext}`;
    const file = new File([new Blob(this.chunks, { type: mimeType })], name, { type: mimeType });
    this.uploadFile(file);
  }

  capturePhoto() {
    const v = this.videoPreview?.nativeElement;
    const c = this.photoCanvas?.nativeElement;
    if (!v || !c) return;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    c.getContext('2d')!.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      this.photoBlob = blob;
      this.phase.set('preview');
    }, 'image/jpeg', 0.92);
  }

  retakePhoto() {
    this.photoBlob = null;
    this.phase.set('ready');
    setTimeout(() => {
      const v = this.videoPreview?.nativeElement;
      if (v && this.stream) { v.srcObject = this.stream; v.play().catch(() => {}); }
    }, 0);
  }

  uploadPhoto() {
    if (!this.photoBlob) return;
    const file = new File([this.photoBlob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
    this.uploadFile(file);
  }

  private uploadFile(file: File) {
    this.phase.set('uploading');
    this.stopStream();
    this.uploadService.upload(file).subscribe({
      next: arquivo => {
        this.uploaded.emit(arquivo);
        this.resetState();
      },
      error: () => {
        this.errorMsg.set('Erro ao enviar arquivo');
        this.phase.set('ready');
      },
    });
  }

  close() {
    if (this.phase() === 'uploading') return;
    if (this.phase() === 'recording') this.stopRecording();
    this.stopStream();
    this.resetState();
  }

  private stopStream() {
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    const v = this.videoPreview?.nativeElement;
    if (v) v.srcObject = null;
  }

  private resetState() {
    this.mode.set(null);
    this.phase.set('requesting');
    this.errorMsg.set(null);
    this.chunks = [];
    this.photoBlob = null;
    this.duration.set(0);
  }

  formatDuration(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.stopStream();
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
