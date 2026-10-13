import catalog from '../../../shared/models/pei-pdf-template.json';
export interface Topic { key: string; title: string; enabled: boolean; fields: Record<string, string>; selected: string[]; }
export interface PeiDocument { version: number; topics: Topic[]; }
export const PEI_CATALOG = catalog;
export function emptyTopics(): Topic[] {
  return catalog.map(t => ({ key: t.key, title: t.title, enabled: true, fields: {}, selected: [] }));
}
