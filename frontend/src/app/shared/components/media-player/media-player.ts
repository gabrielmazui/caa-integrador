import { Component, ElementRef, ViewChild, computed, input, signal, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-media-player',
  templateUrl: './media-player.html',
})
export class MediaPlayerComponent implements OnDestroy {
  private static durations = new Map<string, number>();
  private probeCleanup?: () => void;
  private source = '';
  private attemptedProbe = false;
  src = input.required<string>();
  kind = input<'audio' | 'video'>('audio');
  title = input<string | null>(null);

  @ViewChild('media') media?: ElementRef<HTMLMediaElement>;

  playing = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(1);
  muted = signal(false);
  loaded = signal(0);

  progress = computed(() => this.duration() ? (this.currentTime() / this.duration()) * 100 : 0);
  loadedProgress = computed(() => this.duration() ? (this.loaded() / this.duration()) * 100 : 0);
  durationLabel = computed(() => this.duration() > 0 ? this.formatTime(this.duration()) : '—:—');

  togglePlayback() {
    const media = this.media?.nativeElement;
    if (!media) return;
    if (media.paused) media.play().catch(() => {});
    else media.pause();
  }

  seek(event: Event) {
    const media = this.media?.nativeElement;
    if (!media) return;
    const value = Number((event.target as HTMLInputElement).value);
    media.currentTime = value;
    this.currentTime.set(value);
  }

  setVolume(event: Event) {
    const media = this.media?.nativeElement;
    if (!media) return;
    const value = Number((event.target as HTMLInputElement).value);
    media.volume = value;
    media.muted = value === 0;
    this.volume.set(value);
    this.muted.set(value === 0);
  }

  toggleMute() {
    const media = this.media?.nativeElement;
    if (!media) return;
    media.muted = !media.muted;
    this.muted.set(media.muted);
  }

  updateState(event?: Event) {
    const media = (event?.target as HTMLMediaElement | null) ?? this.media?.nativeElement;
    if (!media) return;
    const source = media.currentSrc || media.src;
    if (source !== this.source) {
      this.probeCleanup?.();
      this.source = source;
      this.attemptedProbe = false;
      this.duration.set(MediaPlayerComponent.durations.get(source) ?? 0);
      this.loaded.set(0);
    }
    this.currentTime.set(Number.isFinite(media.currentTime) ? media.currentTime : 0);
    if (Number.isFinite(media.duration) && media.duration > 0) {
      this.rememberDuration(source, media.duration);
    } else if (media.duration === Infinity && !this.duration() && !this.attemptedProbe) {
      this.resolveDuration(media, source);
    }
    this.playing.set(!media.paused && !media.ended);
    if (media.buffered.length) this.loaded.set(media.buffered.end(media.buffered.length - 1));
  }

  private rememberDuration(source: string, duration: number) {
    this.duration.set(duration);
    if (MediaPlayerComponent.durations.size >= 100) {
      MediaPlayerComponent.durations.delete(MediaPlayerComponent.durations.keys().next().value!);
    }
    MediaPlayerComponent.durations.set(source, duration);
  }

  // Some recorded files omit duration metadata. Probe a separate, muted element
  // so finding the end never moves the user's playback position or plays sound.
  private resolveDuration(media: HTMLMediaElement, source: string) {
    this.attemptedProbe = true;
    const probe = document.createElement(media.tagName.toLowerCase()) as HTMLMediaElement;
    probe.muted = true;
    probe.preload = 'auto';
    const cleanup = () => {
      clearTimeout(timeout);
      probe.onloadedmetadata = probe.ondurationchange = probe.ontimeupdate = probe.onseeked = probe.onerror = null;
      probe.removeAttribute('src');
      probe.load();
      if (this.probeCleanup === cleanup) this.probeCleanup = undefined;
    };
    const readDuration = () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) {
        if (source === this.source) this.rememberDuration(source, probe.duration);
        cleanup();
        return true;
      }
      return false;
    };
    const timeout = setTimeout(cleanup, 15000);
    this.probeCleanup = cleanup;
    probe.onloadedmetadata = () => {
      if (!readDuration()) {
        try { probe.currentTime = 1e10; } catch { cleanup(); }
      }
    };
    probe.ondurationchange = readDuration;
    probe.ontimeupdate = readDuration;
    probe.onseeked = readDuration;
    probe.onerror = cleanup;
    probe.src = source;
    probe.load();
  }

  ngOnDestroy() { this.probeCleanup?.(); }

  toggleFullscreen() {
    const media = this.media?.nativeElement as HTMLVideoElement | undefined;
    if (!media) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else media.closest('.video-player-shell')?.requestFullscreen?.().catch(() => {});
  }

  formatTime(value: number) {
    if (!Number.isFinite(value)) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
