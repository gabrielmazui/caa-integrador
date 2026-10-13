import { describe, expect, it } from 'vitest';
import { composeNote, unpackChoices, PEI_GROUPS } from './pei-guide';
import { PEI_SECTIONS } from './pei-template';

describe('Preenchimento guiado do PEI', () => {
  it('preserva marcações e texto livre ao reabrir uma anotação', () => {
    const content = composeNote(['Tablet', 'Agenda visual'], 'Usar durante a rotina da manhã.');
    const restored = unpackChoices(content, 'recursos');
    expect(restored.choices).toEqual(['Tablet', 'Agenda visual']);
    expect(restored.text).toBe('Usar durante a rotina da manhã.');
    expect(composeNote(restored.choices, restored.text)).toBe(content);
  });
  it('não remove textos ou marcações não reconhecidas', () => {
    const text = '☑ Apoio específico\nTexto da equipe';
    expect(unpackChoices(text, 'recursos')).toEqual({ choices: [], text });
  });
  it('não inventa escolhas nem preenche exemplos de objetivos', () => {
    expect(composeNote([], '', {})).toBe('');
    const note = composeNote([], 'Acompanhar em sala.', { acao: 'Pedir ajuda', ambiente: 'Sala de aula' });
    expect(note).toContain('Pedir ajuda');
    expect(note).toContain('Sala de aula');
    expect(note).not.toContain('80%');
    expect(note).not.toContain('Por quanto tempo?');
  });
  it('mostra todos os campos do modelo uma única vez', () => {
    const keys = PEI_GROUPS.flatMap(g => g.sections.map(s => s.key));
    expect(keys.length).toBe(PEI_SECTIONS.length);
    expect(new Set(keys).size).toBe(PEI_SECTIONS.length);
  });
});

