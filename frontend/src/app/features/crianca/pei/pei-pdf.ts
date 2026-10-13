import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PEI_CATALOG, PeiDocument } from './pei-document';

export async function generatePeiPdf(document: PeiDocument, assets?: Uint8Array[]): Promise<Uint8Array> {
  const buffers = assets ?? await Promise.all(['modelo-pei.pdf', 'arial-regular.ttf', 'arial.ttf'].map(async name => {
    const response = await fetch(new URL('pei/' + name, window.document.baseURI));
    if (!response.ok) throw new Error('Não foi possível carregar o modelo do PEI.');
    return new Uint8Array(await response.arrayBuffer());
  }));
  const pdf = await PDFDocument.load(buffers[0]);
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(buffers[1]);
  const bold = await pdf.embedFont(buffers[2]);
  const fallback = await pdf.embedFont(StandardFonts.Helvetica);
  const fallbackBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  function fontFor(char: string, strong = false): PDFFont {
    const font = strong ? bold : regular;
    if (font.getCharacterSet().includes(char.codePointAt(0)!)) return font;
    const replacement = strong ? fallbackBold : fallback;
    try { replacement.encodeText(char); return replacement; }
    catch { throw new Error('O caractere “' + char + '” não existe na fonte do modelo. Substitua-o antes de baixar.'); }
  }
  const width = (text: string, strong = false) => [...text].reduce((sum, char) => sum + fontFor(char, strong).widthOfTextAtSize(char, 12), 0);
  function draw(page: number, text: string, x: number, top: number, strong = false) {
    for (const char of text) {
      const font = fontFor(char, strong);
      pages[page].drawText(char, { x, y: pages[page].getHeight() - top - 11, size: 12, font, color: rgb(0,0,0) });
      x += font.widthOfTextAtSize(char, 12);
    }
  }
  function mask(page: number, rect: number[]) {
    pages[page].drawRectangle({ x: rect[0], y: pages[page].getHeight()-rect[3], width: rect[2]-rect[0], height: rect[3]-rect[1], color: rgb(1,1,1) });
  }
  function fill(text: string, boxes: {page:number;rect:number[]}[], label: string) {
    let remaining = text.replace(/\r/g, '').replace(/\t/g, '    ').trim();
    for (const box of boxes) {
      const [x, y, right, bottom] = box.rect;
      for (let top = y; top + 13 <= bottom && remaining; top += 20.7) {
        const paragraph = remaining.split('\n')[0];
        let length = 0;
        for (const char of paragraph) {
          if (width(paragraph.slice(0, length) + char) > right-x) break;
          length += char.length;
        }
        if (length < paragraph.length) {
          const space = paragraph.slice(0,length).lastIndexOf(' ');
          if (space > 0) length = space;
        }
        if (!length && paragraph) break;
        draw(box.page, paragraph.slice(0,length), x, top);
        remaining = remaining.slice(length);
        if (remaining.startsWith('\n')) remaining = remaining.slice(1);
        else remaining = remaining.replace(/^ +/, '');
      }
    }
    if (remaining) throw new Error('O texto de “' + label + '” não cabe no espaço do modelo. Encurte esse campo antes de baixar; o conteúdo completo continua salvo no editor.');
  }
  for (const definition of PEI_CATALOG) {
    const topic = document.topics.find(t => t.key === definition.key);
    if (!topic) continue;
    if (!topic.enabled) {
      for (const area of definition.hide) mask(area.page, area.rect);
      if (definition.heading) mask(definition.heading.page, definition.heading.rect);
      continue;
    }
    const heading = definition.heading;
    if (heading && (topic.title !== definition.title || heading.always)) {
      mask(heading.page, heading.rect);
      if (width(topic.title, true) > heading.rect[2]-heading.rect[0]) throw new Error('Encurte o título “' + topic.title + '” para caber no modelo.');
      draw(heading.page, topic.title, heading.rect[0], heading.rect[1], true);
    }
    for (const field of definition.fields) fill(topic.fields[field.key] ?? '', field.boxes, topic.title + ': ' + field.label);
    if (topic.key === 'objetivo') draw(3, 'Passos de Ensino (Micropassos):', 72, 716, true);
    for (const option of definition.options) if (topic.selected.includes(option.id)) {
      const [x,y,r,b] = option.rect;
      const page = pages[option.page], height = page.getHeight();
      page.drawLine({start:{x:x+2,y:height-y-3},end:{x:r-2,y:height-b+3},thickness:1});
      page.drawLine({start:{x:r-2,y:height-y-3},end:{x:x+2,y:height-b+3},thickness:1});
    }
  }
  pdf.setTitle('Plano Educacional Individualizado (PEI)');
  return pdf.save();
}
