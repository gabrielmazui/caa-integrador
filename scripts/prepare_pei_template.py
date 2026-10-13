"""Prepare the supplied PDF without re-typesetting its static content.

Run explicitly when updating the source template. No student data is used here.
Requires PyMuPDF. Coordinates use the source PDF's top-left origin, in points.
"""
import argparse
import json
from pathlib import Path
import pymupdf as fitz

parser = argparse.ArgumentParser()
parser.add_argument('source')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / 'frontend/public/pei'
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(args.source)
catalog = []

def topic(key, title, page=None, heading=None, hide=None):
    item = dict(key=key, title=title, fields=[], options=[], hide=hide or [])
    if page is not None and heading:
        matches = doc[page].search_for(heading)
        if not matches:
            raise ValueError(heading)
        r = matches[0]
        item['heading'] = dict(page=page, rect=[r.x0, r.y0, min(528, r.x0 + max(r.width, 220)), r.y1], original=heading)
    catalog.append(item)
    return item

def field(item, key, label, boxes, size=12):
    # Each box is page,x0,y0,x1,y1. Text continues across boxes in order.
    item['fields'].append(dict(key=key, label=label, boxes=[dict(page=b[0], rect=[b[1],b[2],min(b[3],519),b[4]]) for b in boxes], size=size))
    for p, x0, y0, x1, y1 in boxes:
        doc[p].add_redact_annot(fitz.Rect(x0, y0, x1, y1), fill=False)

i = topic('identificacao', 'Identificação do estudante',0,'1. Identificação do Estudante',hide=[dict(page=0,rect=[72,186,532,400])])
field(i,'escola','Escola',[[0,116,124,528,140]])
field(i,'elaborado','Elaborado por',[[0,154,144,528,162]])
field(i,'data','Data de elaboração',[[0,186,165,528,182]])
for key,label,y in [('nome','Nome completo',244),('nascimento','Data de nascimento',276),('idade','Idade',308),('serie','Série/ano',340),('equipe','Equipe responsável',372)]:
    field(i,key,label,[[0,235,y,527,y+19]])

for key,title,page,heading,box in [
    ('anamnese','Anamnese',0,'Anamnese – Resumo:',[77,502,528,560]),
    ('checklist','Resultados de checklists',0,'Checklist – Resultados:',[77,618,528,654]),
    ('protocolo','Protocolo aplicado',0,'Protocolo Aplicado:',[72,727,529,764]),
    ('resultado_protocolo','Resultados do protocolo',1,'Resultados do Protocolo de avaliacao:',[77,119,528,178]),
    ('observacao_sala','Observação em sala de aula',1,'Observação em Sala de Aula:',[77,235,528,314]),
    ('observacao_recreio','Observação no recreio',1,'Observação no Recreio:',[77,371,528,430]),
    ('observacao_outros','Observação em outros ambientes',1,'Observação em Outros Ambientes:',[77,487,528,649]),
]:
    t=topic(key,title,page,heading,hide=[dict(page=page,rect=[72,doc[page].search_for(heading)[0].y0-1,529,box[3]+2])])
    field(t,'texto','Texto',[[page,*box]])

t=topic('estudo_caso','Estudo de caso',1,'3. Estudo de Caso',hide=[dict(page=1,rect=[72,679,529,734]),dict(page=2,rect=[72,72,529,762]),dict(page=3,rect=[72,72,529,241])])
field(t,'texto','Estudo de caso',[[2,84,78,522,757],[3,84,78,522,239]])

t=topic('objetivo','Objetivo 1',3,'Objetivo 1 – Exemplo preenchido',hide=[dict(page=3,rect=[72,489,529,765]),dict(page=4,rect=[72,72,529,149])])
# Replace sample labels, retaining their original typography and positions.
for heading in ['Objetivo 1 – Exemplo preenchido','Passos de Ensino (Micropassos – Exemplo):']:
    for r in doc[3].search_for(heading): doc[3].add_redact_annot(r,fill=False)
t['heading']['always']=True
for key,label,y in [('acao','Ação mensurável',548),('antecedente','Antecedente',580),('ambiente','Ambiente',612),('criterio','Critério de acerto',644),('dias','Dias consecutivos',676)]:
    field(t,key,label,[[3,204,y,528,y+20]])
field(t,'passos','Passos de ensino',[[3,90,744,528,762],[4,90,72,528,131]])

t=topic('objetivo_2','Objetivo 2',4,'EXEMPLO PARA PREENCHER',hide=[dict(page=4,rect=[72,158,529,365])])
t['heading']['always']=True
for r in doc[4].search_for('EXEMPLO PARA PREENCHER'): doc[4].add_redact_annot(r,fill=False)
for key,label,y in [('acao','Ação mensurável',181),('antecedente','Antecedente',202),('ambiente','Ambiente',223),('criterio','Critério de acerto',244),('dias','Dias consecutivos',264)]:
    # These source rows contain markdown-like pipes; replace only the value portion.
    line=doc[4].get_text('text',clip=fitz.Rect(77,y,529,y+18)).strip()
    words=doc[4].get_text('words',clip=fitz.Rect(77,y,529,y+18))
    pipes=[w for w in words if w[4]=='|']
    x=pipes[1][2]+3 if len(pipes)>1 else 210
    field(t,key,label,[[4,x,y,527,y+18]])
field(t,'passos','Passos de ensino',[[4,95,306,527,364]])

t=topic('adaptacao_ambiente','Adaptações de ambiente',4,'5. Adaptações de Ambiente',hide=[dict(page=4,rect=[72,394,529,746]),dict(page=5,rect=[72,72,529,340])])
for key,label,page,y,h in [('sentar','Lugar para sentar',4,453,38),('organizacao','Organização da sala',4,506,38),('calma','Canto para se acalmar',4,558,38),('entrada','Horário de entrada',4,611,38),('saida','Horário de saída',4,664,38),('alimentacao','Alimentação',4,716,20),('recreio','Recreio',5,78,38),('outras','Outras adaptações',5,131,38)]:
    field(t,key,label,[[page,176,y,528,y+h]])
# The source repeats adaptation fields as inline examples. Keep the labels, remove the examples.
for r in doc[5].search_for('['):
    if 198 <= r.y0 <= 338:
        doc[5].add_redact_annot(fitz.Rect(r.x0,r.y0,529,r.y1),fill=False)

def check_topic(key,title,page,heading,regions):
    t=topic(key,title,page,heading,hide=[dict(page=p,rect=[72,y0,529,y1]) for p,y0,y1 in regions])
    for p,y0,y1 in regions:
        words=doc[p].get_text('words')
        checks=[w for w in words if w[4]=='☐' and y0 <= w[1] < y1]
        # Column x positions derive from the source, not from a recreated table.
        cols=sorted(set(round(w[0],1) for w in checks))
        for other in [w for w in words if w[4]=='Outros:' and y0 <= w[1] < y1]:
            right=next((c-10 for c in cols if c>other[0]+15),519)
            bottom=min([q[1]-3 for q in checks if q[1]>other[1]+5]+[y1])
            if any('_' in q[4] and other[0]-20 <= q[0] < right and other[1]-1 <= q[1] < bottom for q in words):
                continue
            field(t,'outros_'+str(len(t['fields'])),'Outros '+str(len(t['fields'])+1),[[p,other[0],other[3]+2,right,max(other[3]+16,bottom)]])
        for w in checks:
            x=round(w[0],1)
            right=next((c-5 for c in cols if c>x+15),529)
            below=min([q[1]-2 for q in checks if q[1]>w[1]+5]+[y1])
            label=' '.join(doc[p].get_text('text',clip=fitz.Rect(w[0]-.1,w[1]-.1,right,below)).split()).removeprefix('☐').strip()
            if not label: continue
            option=dict(id=f'{key}_{len(t["options"])}',label=label,page=p,rect=list(w[:4]))
            if 'Outros:' in label or 'Qual?' in label or '___' in label:
                option['label']=label.split('Qual?')[0].split('___')[0].strip()
            t['options'].append(option)
        # Writable details already present in the original checklist cells.
        for block in doc[p].get_text('rawdict')['blocks']:
            for line in block.get('lines',[]):
                chars=[c for span in line['spans'] for c in span['chars']]
                underscores=[c for c in chars if c['c']=='_' and y0 <= c['bbox'][1] < y1]
                if not underscores: continue
                left=min(c['bbox'][0] for c in underscores)
                top=min(c['bbox'][1] for c in underscores)
                right=max(c['bbox'][2] for c in underscores)
                bottom=max(c['bbox'][3] for c in underscores)
                field(t,'detalhe_'+str(len(t['fields'])),'Especificar opção / outros '+str(len(t['fields'])+1),[[p,left,top,right,bottom+1]])
    return t

check_topic('recursos','Recursos',5,'6. Recursos',[(5,440,756),(6,76,115)])
check_topic('adaptacao_material','Adaptação de material',6,'ADAPTAÇÃO DE MATERIAL',[(6,223,453)])
check_topic('adaptacao_sala','Adaptação da sala de aula',6,'ADAPTAÇÃO DA SALA DE AULA',[(6,560,758)])
check_topic('adaptacao_atividade','Adaptação de atividades',7,'ADAPTAÇÃO DE ATIVIDADES',[(7,170,515)])
check_topic('adaptacao_tempo','Adaptação de tempo',7,'ADAPTAÇÃO DE TEMPO',[(7,620,736)])
check_topic('seguranca_gatilhos','Gatilhos',8,'GATILHOS',[(8,155,320)])
check_topic('seguranca_sinais','Sinais iniciais',8,'SINAIS INICIAIS',[(8,387,579)])
check_topic('seguranca_comportamento','Forma mais severa',8,'FORMA MAIS SEVERA',[(8,646,750),(9,76,110)])
check_topic('seguranca_acalmar','Como acalmar',9,'COMO ACALMAR',[(9,194,400)])
check_topic('seguranca_prevenir','Como prevenir',9,'COMO PREVENIR',[(9,485,707)])
check_topic('seguranca_substituta','Habilidade substituta',9,'HABILIDADE SUBSTITUTA',[(10,103,267)])

t=topic('seguranca_responsaveis','Responsáveis pelo plano de segurança',10,'Responsáveis pelo Plano de Segurança',hide=[dict(page=10,rect=[72,308,529,449])])
for key,label,box in [('direto','Responsável direto',[217,329,528,347]),('apoio','Responsável de apoio',[233,350,528,368]),('acionar','Quem acionar',[326,370,528,388]),('como','Como acionar',[189,412,528,430])]:
    field(t,key,label,[[10,*box]])
# Clean the whole placeholder, including its last letters beyond the writing inset.
for y in [329,350,370,412]: doc[10].add_redact_annot(fitz.Rect(519,y,529,y+18),fill=False)
for box in [[108,391,528,408],[108,433,528,449]]: doc[10].add_redact_annot(fitz.Rect(*box),fill=False)
t=topic('revisao','Datas para revisão do PEI',10,'Datas para a revisão do PEI:',hide=[dict(page=10,rect=[72,474,529,594])])
for n,y in enumerate([501,526,551,576]): field(t,str(n+1),f'Revisão {n+1}',[[10,97,y,528,y+18]])

# Extract the original embedded Arial fonts; they belong to the supplied document.
for xref,name in [(27,'arial'),(28,'arial-regular')]:
    (out / (name+'.ttf')).write_bytes(doc.extract_font(xref)[3])
for p in doc:
    p.apply_redactions(images=0,graphics=0)
doc.save(out/'modelo-pei.pdf',garbage=4,deflate=True)
(root/'frontend/src/app/shared/models/pei-pdf-template.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Prepared {len(catalog)} topics and {sum(len(t["options"]) for t in catalog)} checkboxes.')
