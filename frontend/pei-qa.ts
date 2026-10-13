import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { generatePeiPdf } from './src/app/features/crianca/pei/pei-pdf';
import { emptyTopics, PEI_CATALOG } from './src/app/features/crianca/pei/pei-document';
async function main() {
  const assets = ['modelo-pei.pdf','arial-regular.ttf','arial.ttf'].map(n => new Uint8Array(readFileSync('public/pei/'+n)));
  const topics = emptyTopics();
  topics[0].fields = { nome: 'Estudante de teste', nascimento: '16/07/2019', idade: '7 anos', escola: 'Escola de teste', elaborado: 'Equipe pedagógica', data: '13/10/2026', serie: '2º ano', equipe: 'Professora e equipe de apoio' };
  topics.find(t => t.key==='anamnese')!.fields['texto'] = 'Comunica suas preferências e participa das atividades com apoio da equipe.';
  topics.find(t => t.key==='objetivo')!.fields = { acao: 'Pedir ajuda', antecedente: 'Durante a atividade', ambiente: 'Sala de aula', criterio: '80%', dias: '3 dias', passos: 'Apresentar o cartão de ajuda.\nOferecer apoio quando necessário.' };
  for (const definition of PEI_CATALOG) {
    const topic = topics.find(t => t.key === definition.key)!;
    if (definition.options.length) topic.selected = [definition.options[0].id];
    for (const field of definition.fields) if (!topic.fields[field.key]) topic.fields[field.key] = 'Teste';
  }
  mkdirSync('../tmp/pei-qa', {recursive:true});
  writeFileSync('../tmp/pei-qa/sample.pdf', await generatePeiPdf({version:1, topics},assets));
  topics[0].fields['nome'] = 'Muito longo '.repeat(100);
  try { await generatePeiPdf({version:1,topics},assets); throw new Error('Overflow was not rejected'); }
  catch(e: any) { if (!e.message.includes('não cabe')) throw e; }
  console.log('PDF generated; overflow correctly rejected.');
}
main();
