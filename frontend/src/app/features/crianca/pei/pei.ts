import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { CriancaStateService } from '../crianca-state.service';
import { PeiService } from '../../../shared/services/pei.service';
import { AnotacaoPei } from '../../../shared/models/pei.models';
import { PEI_CATALOG, emptyTopics, PeiDocument } from './pei-document';

@Component({
  imports: [FormsModule], templateUrl: './pei.html', styleUrl: './pei.css',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-y-auto' },
})
export class PeiComponent {
  private http = inject(HttpClient);
  private state = inject(CriancaStateService);
  private legacy = inject(PeiService);
  child = computed(() => this.state.current());
  catalog = PEI_CATALOG;
  document = signal<PeiDocument>({ version: 0, topics: emptyTopics() });
  activeKey = signal('identificacao');
  active = computed(() => this.document().topics.find(t => t.key === this.activeKey())!);
  definition = computed(() => this.catalog.find(t => t.key === this.activeKey())!);
  loading = signal(true);
  loaded = signal(false);
  busy = signal(false);
  error = signal('');
  status = signal('');
  oldNotes = signal<AnotacaoPei[]>([]);
  showOld = signal(false);
  year = new Date().getFullYear();
  semester = new Date().getMonth() < 6 ? 1 : 2;
  private generation = 0;
  dirty = computed(() => JSON.stringify(this.document().topics) !== this.snapshot());
  private snapshot = signal('');
  constructor() {
    toObservable(this.child).pipe(filter(Boolean), distinctUntilChanged((a,b) => a?.id === b?.id), takeUntilDestroyed())
      .subscribe(() => this.load());
  }
  private url() {
    return environment.apiUrl + '/criancas/' + this.child()!.id + '/pei?ano=' + this.year + '&semestre=' + this.semester;
  }
  async load() {
    const generation = ++this.generation;
    this.loading.set(true); this.loaded.set(false); this.error.set(''); this.oldNotes.set([]);
    try {
      const result = await firstValueFrom(this.http.get<PeiDocument>(this.url()));
      if (generation !== this.generation) return;
      const topics = emptyTopics().map(t => result.topics.find(s => s.key === t.key) ?? t);
      if (!result.version) {
        topics[0].fields['nome'] = this.child()?.nome ?? '';
        const birth = this.child()?.dataNascimento;
        if (birth) topics[0].fields['nascimento'] = birth.split('-').reverse().join('/');
      }
      this.document.set({ version: result.version, topics });
      this.loaded.set(true);
      this.snapshot.set(JSON.stringify(topics)); this.status.set('');
      this.legacy.list(this.child()!.id, this.year, this.semester as 1 | 2).subscribe({
        next: notes => { if (generation === this.generation) this.oldNotes.set(notes); },
        error: () => { if (generation === this.generation) this.error.set('O PEI carregou, mas não foi possível consultar os textos anteriores.'); },
      });
    } catch { if (generation === this.generation) this.error.set('Não foi possível carregar o PEI. Tente novamente.'); }
    finally { if (generation === this.generation) this.loading.set(false); }
  }
  edit() {
    this.document.update(d => ({ ...d, topics: [...d.topics] }));
    this.status.set('');
  }
  toggle(id: string, checked: boolean) {
    const t = this.active();
    t.selected = checked ? [...t.selected, id] : t.selected.filter(x => x !== id);
    this.edit();
  }
  period(year: number, semester: number) {
    if (this.dirty() && !confirm('Há alterações não salvas. Descartá-las e trocar o período?')) return;
    this.year = Number(year); this.semester = Number(semester); this.load();
  }
  async save(): Promise<boolean> {
    if (!this.loaded() || this.busy()) return false;
    this.busy.set(true); this.error.set('');
    const payload = structuredClone(this.document());
    try {
      const response = await firstValueFrom(this.http.put<PeiDocument>(this.url(), payload));
      this.document.set(response); this.snapshot.set(JSON.stringify(response.topics));
      this.status.set('Alterações salvas'); return true;
    } catch (e: any) {
      this.error.set(e.error?.message ?? 'Não foi possível salvar. Seu texto continua aqui.');
      return false;
    } finally { this.busy.set(false); }
  }
  async download() {
    if (!this.loaded() || this.busy()) return;
    this.busy.set(true); this.error.set('');
    try {
      const { generatePeiPdf } = await import('./pei-pdf');
      const bytes = await generatePeiPdf(this.document());
      this.busy.set(false);
      if (this.dirty() && !(await this.save())) return;
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const a = window.document.createElement('a');
      a.href = url; a.download = 'PEI-' + this.year + '-' + this.semester + '.pdf'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) { this.error.set(e.message ?? 'Não foi possível gerar o PDF.'); }
    finally { this.busy.set(false); }
  }
  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent) { if (this.loaded() && this.dirty()) event.preventDefault(); }
  canLeave() { return !this.busy() && (!this.loaded() || !this.dirty() || confirm('Há alterações não salvas no PEI. Sair sem salvar?')); }
}
