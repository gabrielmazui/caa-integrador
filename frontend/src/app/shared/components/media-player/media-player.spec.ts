import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaPlayerComponent } from './media-player';

describe('MediaPlayer duration', () => {
  let player: MediaPlayerComponent;
  afterEach(() => { player?.ngOnDestroy(); vi.restoreAllMocks(); });

  function setup(duration: number, source: string) {
    player = TestBed.runInInjectionContext(() => new MediaPlayerComponent());
    const media = {
      currentSrc: source, src: source, duration, currentTime: 0,
      paused: true, ended: false, tagName: 'AUDIO', buffered: { length: 0 },
    } as unknown as HTMLMediaElement;
    player.media = new ElementRef(media);
    return media;
  }

  it('shows duration from metadata before playback', () => {
    setup(83, '/metadata-audio.webm');
    player.updateState();
    expect(player.durationLabel()).toBe('1:23');
    expect(player.playing()).toBe(false);
  });

  it('does not replace a known duration with zero when metadata is temporarily unavailable', () => {
    const media = setup(42, '/stable-audio.webm');
    player.updateState();
    Object.assign(media, { duration: NaN });
    player.updateState();
    expect(player.duration()).toBe(42);
  });

  it('clears stale duration when the source changes', () => {
    const media = setup(42, '/first-audio.webm');
    player.updateState();
    Object.assign(media, { currentSrc: '/second-audio.webm', duration: NaN });
    player.updateState();
    expect(player.durationLabel()).toBe('—:—');
  });

  it('resolves missing recording duration without seeking the visible player', () => {
    const media = setup(Infinity, '/recording.webm');
    const probe = {
      duration: Infinity, currentTime: 0, muted: false, preload: '', src: '',
      load: vi.fn(), removeAttribute: vi.fn(),
      onloadedmetadata: null, ondurationchange: null, ontimeupdate: null,
      onseeked: null, onerror: null,
    };
    vi.spyOn(document, 'createElement').mockReturnValue(probe as unknown as HTMLAudioElement);
    player.updateState();
    (probe.onloadedmetadata as unknown as () => void)();
    expect(probe.currentTime).toBe(1e10);
    expect(media.currentTime).toBe(0);
    probe.duration = 67;
    (probe.ondurationchange as unknown as () => void)();
    expect(player.durationLabel()).toBe('1:07');
    expect(probe.removeAttribute).toHaveBeenCalledWith('src');
    expect(probe.ondurationchange).toBeNull();
  });
});
