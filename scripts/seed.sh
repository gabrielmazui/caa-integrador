#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE_URL:-http://localhost:8080/api}"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}▶ $*${NC}" >&2; }
warn() { echo -e "${YELLOW}⚠ $*${NC}" >&2; }

require_node() {
  if ! command -v node &>/dev/null; then
    echo -e "${RED}Node.js is required to run the seed.${NC}"; exit 1
  fi
}
require_node

log "Aguardando a API em $BASE..."
until curl -sS -o /dev/null "$BASE/auth/login"; do
  sleep 2
done

# O Compose executa este script a cada nova subida. Se o usuário principal já
# autentica, os dados iniciais já foram carregados e não devem ser duplicados.
if curl -fsS -o /dev/null -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary '{"email":"ana@caa.dev","senha":"senha123"}' 2>/dev/null; then
  log "Seed já aplicado; nada a fazer."
  exit 0
fi

json_field() {
  node -e 'let input=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", chunk => input += chunk); process.stdin.on("end", () => { const value = JSON.parse(input)[process.argv[1]]; process.stdout.write(value == null ? "" : String(value)); });' "$1"
}

json_child_id() {
  node -e 'let input=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", chunk => input += chunk); process.stdin.on("end", () => { const child = JSON.parse(input).find(item => item.nome === process.argv[1]); process.stdout.write(child?.id ?? ""); });' "$1"
}

# ─────────────────────────────────────────────
# Register or login a user; returns token
# ─────────────────────────────────────────────
auth() {
  local nome="$1" email="$2" senha="$3" tipo="$4" especialidade="${5:-}"

  local payload
  payload=$(node -e 'const [nome,email,senha,tipo,especialidade] = process.argv.slice(1); process.stdout.write(JSON.stringify({nome,email,senha,tipoUsuario:tipo,especialidade:especialidade || null}));' \
    "$nome" "$email" "$senha" "$tipo" "$especialidade")

  local res
  res=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
    -H "Content-Type: application/json; charset=utf-8" --data-binary "$payload")
  local code
  code=$(echo "$res" | tail -1)
  local body
  body=$(echo "$res" | head -1)

  if [[ "$code" == "201" ]]; then
    log "Registered: $email"
    echo "$body" | json_field accessToken
  elif [[ "$code" == "409" ]]; then
    warn "$email already exists, logging in..."
    body=$(curl -s -X POST "$BASE/auth/login" \
      -H "Content-Type: application/json; charset=utf-8" \
      --data-binary "{\"email\":\"$email\",\"senha\":\"$senha\"}")
    echo "$body" | json_field accessToken
  else
    echo -e "${RED}Auth failed for $email: $code $body${NC}" >&2
    exit 1
  fi
}

post() {
  local token="$1" method="$2" path="$3" data="$4"
  curl -s -X "$method" "$BASE$path" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "Authorization: Bearer $token" \
    --data-binary "$data"
}

# ─────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────
log "=== Criando usuários ==="
TOKEN_ANA=$(auth "Ana Souza"   "ana@caa.dev"   "senha123" "profissional" "Fonoaudiologia")
TOKEN_BRUNO=$(auth "Bruno Lima"  "bruno@caa.dev" "senha123" "profissional" "Psicopedagogia")
TOKEN_CARLA=$(auth "Carla Matos" "carla@caa.dev" "senha123" "familiar")
TOKEN_DIEGO=$(auth "Diego Ramos" "diego@caa.dev" "senha123" "familiar")

USER_ANA_ID=$(curl -s -H "Authorization: Bearer $TOKEN_ANA" "$BASE/auth/me" | json_field id)
USER_BRUNO_ID=$(curl -s -H "Authorization: Bearer $TOKEN_BRUNO" "$BASE/auth/me" | json_field id)
log "Ana ID: $USER_ANA_ID | Bruno ID: $USER_BRUNO_ID"

# ─────────────────────────────────────────────
# Criança: Sofia
# ─────────────────────────────────────────────
log "=== Criando Sofia ==="
SOFIA_ID=$(curl -s -H "Authorization: Bearer $TOKEN_ANA" "$BASE/criancas" | json_child_id Sofia)
if [[ -z "$SOFIA_ID" ]]; then
  SOFIA=$(post "$TOKEN_ANA" POST "/criancas" \
    '{"nome":"Sofia","dataNascimento":"2018-03-15","observacoes":"Sofia foi diagnosticada com TEA grau 2 aos 3 anos. Utiliza CAA com pranchas PECS e está em processo de aquisição de fala funcional. Gosta muito de música e atividades sensoriais."}')
  SOFIA_ID=$(echo "$SOFIA" | json_field id)
fi
log "Sofia ID: $SOFIA_ID"

# Membros de Sofia
post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/membros" \
  "{\"email\":\"bruno@caa.dev\",\"papel\":\"terapeuta\",\"descricaoFuncao\":\"Atendimento psicopedagógico às terças e quintas\"}" > /dev/null
post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/membros" \
  "{\"email\":\"carla@caa.dev\",\"papel\":\"mae\"}" > /dev/null
post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/membros" \
  "{\"email\":\"diego@caa.dev\",\"papel\":\"pai\"}" > /dev/null
log "Membros de Sofia adicionados"

# ─────────────────────────────────────────────
# Criança: Miguel
# ─────────────────────────────────────────────
log "=== Criando Miguel ==="
MIGUEL_ID=$(curl -s -H "Authorization: Bearer $TOKEN_ANA" "$BASE/criancas" | json_child_id Miguel)
if [[ -z "$MIGUEL_ID" ]]; then
  MIGUEL=$(post "$TOKEN_ANA" POST "/criancas" \
    '{"nome":"Miguel","dataNascimento":"2020-07-22","observacoes":"Miguel tem síndrome de Down e está no 1º ano do ensino fundamental inclusivo. Comunicativo e sociável, está ampliando o vocabulário funcional com suporte de CAA digital."}')
  MIGUEL_ID=$(echo "$MIGUEL" | json_field id)
fi
log "Miguel ID: $MIGUEL_ID"

post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/membros" \
  "{\"email\":\"bruno@caa.dev\",\"papel\":\"professor\",\"descricaoFuncao\":\"Professor de apoio na escola\"}" > /dev/null
post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/membros" \
  "{\"email\":\"carla@caa.dev\",\"papel\":\"responsavel\"}" > /dev/null
log "Membros de Miguel adicionados"

# ─────────────────────────────────────────────
# Feed de Sofia — registros + comentários
# ─────────────────────────────────────────────
log "=== Feed de Sofia ==="

# Post 1 — profissional, todos
R=$(post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/registros" \
  '{"conteudo":"Sofia teve uma sessão incrível hoje! Conseguiu usar a prancha PECS de forma espontânea para pedir o suco favorito dela. Foi a primeira vez que iniciou a comunicação sem dica verbal. 🎉\n\nEsse é um marco importante no desenvolvimento da comunicação funcional!","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_BRUNO" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Que notícia maravilhosa! Na nossa sessão de quinta ela também demonstrou mais iniciativa. Parece que as estratégias estão funcionando!"}' > /dev/null
post "$TOKEN_CARLA" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Em casa ela também está usando mais a prancha! Ontem pediu a boneca preferida dela usando as figuras 💕"}' > /dev/null
post "$TOKEN_DIEGO" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Que orgulho! Fui eu que estava com ela quando pediu o suco, foi emocionante demais ver isso acontecer."}' > /dev/null

# Post 2 — familiar, todos
R=$(post "$TOKEN_CARLA" POST "/criancas/$SOFIA_ID/registros" \
  '{"conteudo":"Fim de semana diferente! Fomos ao parque e Sofia brincou no escorregador pela primeira vez sem medo. Ela ficou pedindo para ir mais vezes usando os gestos que a Ana ensinou.\n\nAinda estou sorrindo de felicidade 😊","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Que lindo! Estímulos sensoriais no parque são ótimos. Vou incluir atividades de balanço na próxima sessão para aproveitar esse interesse!"}' > /dev/null
post "$TOKEN_DIEGO" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Ela ficou falando do parque a semana toda 🥹"}' > /dev/null

# Post 3 — profissional, apenas profissionais (fixado)
R=$(post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/registros" \
  '{"conteudo":"AVALIAÇÃO SEMESTRAL — Resumo para a equipe:\n\n✅ Comunicação: Atingiu 80% dos objetivos do semestre\n✅ Vocabulário PECS: 45 símbolos reconhecidos\n⚠️ Solicitação espontânea: ainda em desenvolvimento (40%)\n\nSugestão: aumentar exposição a situações naturais de escolha no ambiente doméstico. Compartilhar com os pais as estratégias de espera estruturada.","visibilidade":"profissionais"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_BRUNO" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Concordo com o diagnóstico. No ambiente escolar percebo a mesma dificuldade com solicitação espontânea. Vou adaptar as atividades para mais situações de escolha."}' > /dev/null

# Post 4 — fixado, todos
R=$(post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/registros" \
  '{"conteudo":"📌 INFORMAÇÃO IMPORTANTE PARA A EQUIPE\n\nSofia tem hipersensibilidade auditiva. Por favor:\n- Avise antes de mudanças de ambiente\n- Evite sons altos e inesperados\n- Tenha um headphone de cancelamento de ruído disponível\n\nEm situações de sobrecarga sensorial, a estratégia mais eficaz é oferecer um \"cantinho calmo\" com brinquedo sensorial favorito (o cubo fidget ou a almofada de pesos).","visibilidade":"todos"}')

# Post 5 — familiar
R=$(post "$TOKEN_DIEGO" POST "/criancas/$SOFIA_ID/registros" \
  '{"conteudo":"Hoje foi dia de consulta com a neuropediatra. Tudo bem nos exames! A médica ficou muito satisfeita com o progresso que a Sofia fez nos últimos 6 meses.\n\nAgradecemos muito ao trabalho de toda a equipe, vocês fazem parte da nossa família 💙","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Que ótima notícia! Obrigada por compartilhar. É muito gratificante ver o progresso dela ❤️"}' > /dev/null
post "$TOKEN_BRUNO" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Maravilha! O trabalho em equipe faz toda a diferença mesmo 🙌"}' > /dev/null

# Post 6
R=$(post "$TOKEN_BRUNO" POST "/criancas/$SOFIA_ID/registros" \
  '{"conteudo":"Hoje trabalhamos com o aplicativo de CAA no tablet. Sofia identificou todas as categorias de alimentos e conseguiu montar frases de 2 símbolos (agente + ação)!\n\nPróximos passos: introduzir frases de 3 elementos na semana que vem.","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_CARLA" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Ela adorou o tablet! Em casa fica pegando para \"conversar\" com a gente 😄"}' > /dev/null

# Post 7 — profissional, apenas profissionais
R=$(post "$TOKEN_BRUNO" POST "/criancas/$SOFIA_ID/registros" \
  '{"conteudo":"Nota para a equipe: Sofia apresentou comportamento de auto-estimulação aumentado hoje. Pode ser relacionado ao calor e ao desconforto físico. Verificar com os pais se houve mudança na rotina ou sono recente.","visibilidade":"profissionais"}')

# Post 8
R=$(post "$TOKEN_CARLA" POST "/criancas/$SOFIA_ID/registros" \
  '{"conteudo":"Sofia dormiu a noite toda pela primeira vez em semanas!! Acredito que a rotina de banho morno + massagem + música calma antes de dormir que a Ana sugeriu está funcionando 🙏\n\nMãe descansada, Sofia descansada 😄","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/registros/$RID/comentarios" \
  '{"conteudo":"Ótima notícia! Sono regulado é fundamental para o aprendizado e autorregulação. Continue com a rotina!"}' > /dev/null

# ─────────────────────────────────────────────
# Feed de Miguel
# ─────────────────────────────────────────────
log "=== Feed de Miguel ==="

R=$(post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/registros" \
  '{"conteudo":"Primeira semana de Miguel no ensino fundamental! Ele se adaptou muito bem à turma. Os colegas foram super receptivos e já têm um grupo de amigos que o chamam para brincar no recreio 🏃\n\nA CAA tem sido uma ótima ferramenta de mediação social.","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_CARLA" POST "/criancas/$MIGUEL_ID/registros/$RID/comentarios" \
  '{"conteudo":"Ele chegou em casa falando dos amigos! Foi impossível tirá-lo da cama na terça para não perder a aula 😂"}' > /dev/null
post "$TOKEN_BRUNO" POST "/criancas/$MIGUEL_ID/registros/$RID/comentarios" \
  '{"conteudo":"Em sala de aula o engajamento dele é excelente. Está participando ativamente das atividades em grupo!"}' > /dev/null

R=$(post "$TOKEN_BRUNO" POST "/criancas/$MIGUEL_ID/registros" \
  '{"conteudo":"Miguel leu hoje uma frase completa com 4 palavras usando o caderno de comunicação! \"eu quero jogar bola\"\n\nUm avanço enorme! Vou incluir mais vocabulário relacionado a jogos e esportes já que esse é um interesse forte dele.","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/registros/$RID/comentarios" \
  '{"conteudo":"Que evolução! Frases de 4 elementos é um marco importante. Vou ajustar o PEI para refletir esse progresso 🎯"}' > /dev/null

R=$(post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/registros" \
  '{"conteudo":"Relatório técnico — reunião de equipe 2024.2:\n\nMiguel está progredindo consistentemente em:\n- Leitura funcional: nível 2\n- Comunicação aumentativa: uso independente em 70% das situações\n- Socialização: sem queixas de exclusão\n\nPonto de atenção: matemática ainda requer suporte intensivo.","visibilidade":"profissionais"}')

R=$(post "$TOKEN_CARLA" POST "/criancas/$MIGUEL_ID/registros" \
  '{"conteudo":"Fim de semana de muito futebol! O Miguel adorou assistir o jogo com o pai e ficou apontando para a TV usando o aplicativo de CAA para comentar os gols hahaha\n\nEle tem sido o torcedor mais animado da família 🏆","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_DIEGO" POST "/criancas/$MIGUEL_ID/registros/$RID/comentarios" \
  '{"conteudo":"Ele vibrou em cada gol! Foi um dos melhores domingos que tivemos ❤️"}' > /dev/null
post "$TOKEN_BRUNO" POST "/criancas/$MIGUEL_ID/registros/$RID/comentarios" \
  '{"conteudo":"Esportes são ótimos para a socialização! Vou incluir vocabulário de futebol no caderno de comunicação."}' > /dev/null

R=$(post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/registros" \
  '{"conteudo":"📌 PERFIL DE COMUNICAÇÃO DE MIGUEL\n\nMétodo preferido: prancha digital (tablet)\nBackup: caderno de comunicação impresso\nVocabulário prioritário: alimentos, atividades físicas, pessoas da família, escola\nEstratégias eficazes: time delay, modelagem em espelho\n\nNão usar: prompts físicos desnecessários — Miguel é independente na maioria das atividades","visibilidade":"todos"}')

R=$(post "$TOKEN_BRUNO" POST "/criancas/$MIGUEL_ID/registros" \
  '{"conteudo":"Atividade de culinária na escola hoje! Miguel fez brigadeiro com os colegas e descreveu todo o processo usando o tablet. Conseguiu pedir ingredientes, dar instruções e compartilhar o produto final.\n\nContexto real de comunicação — melhor que qualquer atividade estruturada 🍫","visibilidade":"todos"}')
RID=$(echo "$R" | json_field id)
post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/registros/$RID/comentarios" \
  '{"conteudo":"Atividades de vida diária são fundamentais! Vou propor mais atividades assim nas próximas sessões."}' > /dev/null
post "$TOKEN_CARLA" POST "/criancas/$MIGUEL_ID/registros/$RID/comentarios" \
  '{"conteudo":"Ele chegou em casa insistindo para fazer brigadeiro aqui também 🤣 Vamos fazer no final de semana!"}' > /dev/null

# ─────────────────────────────────────────────
# Chat de Sofia (apenas profissionais)
# ─────────────────────────────────────────────
log "=== Chat de Sofia ==="
for msg in \
  "ANA:Oi Bruno! Vi que Sofia teve uma crise na sessão de ontem. Como foi?" \
  "BRUNO:Foi uma crise de transição, quando fomos mudar de atividade. Durou uns 5 min mas consegui usar o primeiro-depois para acalmá-la." \
  "ANA:Bom uso da estratégia. Vou conversar com os pais sobre reforçar isso em casa também." \
  "BRUNO:Ótimo. Você já preparou a avaliação semestral? Reunião é na próxima semana." \
  "ANA:Sim, já terminei. Vou postar no feed com visibilidade restrita. Os resultados estão bem positivos." \
  "BRUNO:Que alívio. Eu estava preocupado com o nível de solicitação espontânea mas parece que está melhorando." \
  "ANA:Melhorou bastante! Mudamos a estratégia de espera estruturada e fez diferença. Vou detalhar no relatório." \
  "BRUNO:Perfeito. Tem alguma estratégia nova para os próximos 3 meses?" \
  "ANA:Sim, vou propor introdução de comunicação por voz digitalizada. Ela está pronta para esse passo." \
  "BRUNO:Excelente ideia. Posso fazer parte do processo de escolha do dispositivo?"; do
    TOKEN_VAR="${msg%%:*}"
    MESSAGE="${msg#*:}"
    if [[ "$TOKEN_VAR" == "ANA" ]]; then
      T="$TOKEN_ANA"
    else
      T="$TOKEN_BRUNO"
    fi
    post "$T" POST "/criancas/$SOFIA_ID/chat" "{\"conteudo\":\"$MESSAGE\"}" > /dev/null
done

log "=== Chat de Miguel ==="
for msg in \
  "ANA:Bruno, como Miguel está se saindo na nova turma?" \
  "BRUNO:Melhor do que esperava! A professora regente está sendo muito acolhedora." \
  "ANA:Ótimo. Precisamos alinhar as metas do PEI com ela também." \
  "BRUNO:Já conversei informalmente. Ela topou participar de uma reunião de planejamento." \
  "ANA:Perfeito. Posso marcar para a próxima quinta às 14h?" \
  "BRUNO:Topo! Vou confirmar com ela. Vamos incluir a Carla na reunião também?" \
  "ANA:Sim, acho fundamental a família estar presente. Mando convite para ela." \
  "BRUNO:Combinado. Lembrar de trazer o portfólio de comunicação dele."; do
    TOKEN_VAR="${msg%%:*}"
    MESSAGE="${msg#*:}"
    if [[ "$TOKEN_VAR" == "ANA" ]]; then
      T="$TOKEN_ANA"
    else
      T="$TOKEN_BRUNO"
    fi
    post "$T" POST "/criancas/$MIGUEL_ID/chat" "{\"conteudo\":\"$MESSAGE\"}" > /dev/null
done

# ─────────────────────────────────────────────
# PEI de Sofia
# ─────────────────────────────────────────────
log "=== PEI de Sofia ==="
declare -a PEI_SOFIA=(
  "comunicacao|Desenvolver uso espontâneo de PECS fase III: Sofia deverá iniciar 3 ou mais trocas comunicativas por sessão sem dica verbal até o final do semestre.|1|2024"
  "comunicacao|Introduzir caderno de comunicação digital com 60+ símbolos. Treinar navegação independente nas categorias principais.|1|2024"
  "socializacao|Desenvolver habilidades de espera e turno em jogos de mesa com pares. Meta: aguardar a vez por até 2 minutos sem comportamento disruptivo.|1|2024"
  "aprendizagem|Reconhecimento de 10 palavras funcionais escritas (nome, comida favorita, não, sim, ajuda). Usar cartões de pareamento.|1|2024"
  "autonomia|Completar rotina matinal (escova de dentes, lavar mãos, se vestir) com supervisão apenas verbal, sem suporte físico.|2|2024"
  "comportamento|Implementar estratégia de primeiro-depois para transições difíceis. Reduzir crises de transição para menos de 2 por semana.|2|2024"
  "sensorial|Criar \"mochila sensorial\" com itens de regulação. Treinar Sofia a buscar autonomamente quando sentir sobrecarga.|2|2024"
  "objetivo|Sofia deverá usar o dispositivo de CAA para fazer 5+ pedidos diferentes em um dia de escola sem sugestão do professor.|2|2024"
  "estrategia|Implementar time delay de 5 segundos antes de qualquer sugestão comunicativa. Treinar toda a equipe na estratégia.|1|2024"
  "outro|Participar de grupo de habilidades sociais com 3-4 pares com perfis similares. Sessões quinzenais de 45 min.|2|2024"
)
for entry in "${PEI_SOFIA[@]}"; do
  IFS='|' read -r cat cont sem ano <<< "$entry"
  post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/anotacoes-pei" \
    "{\"categoria\":\"$cat\",\"conteudo\":\"$cont\",\"semestre\":$sem,\"ano\":$ano}" > /dev/null
done

log "=== PEI de Miguel ==="
declare -a PEI_MIGUEL=(
  "comunicacao|Miguel deverá usar o tablet de CAA para iniciar conversas com colegas durante o recreio. Meta: 3 iniciações por dia.|1|2024"
  "aprendizagem|Reconhecimento de números de 1 a 20 e contagem de objetos concretos até 10 com independência.|1|2024"
  "aprendizagem|Leitura de palavras de 2-3 sílabas familiares usando método fônico com apoio visual. Meta: 20 palavras até final do semestre.|1|2024"
  "socializacao|Participar de pelo menos uma atividade em grupo por dia na escola sem comportamento de isolamento.|2|2024"
  "autonomia|Completar lanche escolar de forma independente, incluindo abrir embalagens e organizar o espaço.|2|2024"
  "objetivo|Miguel deverá solicitar ajuda de forma funcional (verbal ou por CAA) quando encontrar dificuldade em atividades escolares, sem esperar o professor intervir.|2|2024"
  "estrategia|Usar roteiro visual para todas as transições escolares. Professora deve mostrar o símbolo da atividade seguinte 2 minutos antes.|1|2024"
  "comportamento|Reduzir comportamento de fuga de tarefas através de sistema de escolha: Miguel escolhe entre 2 atividades equivalentes.|2|2024"
)
for entry in "${PEI_MIGUEL[@]}"; do
  IFS='|' read -r cat cont sem ano <<< "$entry"
  post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/anotacoes-pei" \
    "{\"categoria\":\"$cat\",\"conteudo\":\"$cont\",\"semestre\":$sem,\"ano\":$ano}" > /dev/null
done

# ─────────────────────────────────────────────
# Glossário específico de Sofia e Miguel
# ─────────────────────────────────────────────
log "=== Glossário de Sofia ==="
post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/glossario" \
  '{"termo":"Fase III do PECS","definicao":"Etapa em que a criança discrimina entre símbolos e vai ao álbum de comunicação para buscar o símbolo correto e entregá-lo ao parceiro de comunicação para fazer pedidos."}' > /dev/null
post "$TOKEN_BRUNO" POST "/criancas/$SOFIA_ID/glossario" \
  '{"termo":"Time Delay","definicao":"Estratégia em que o profissional aguarda deliberadamente alguns segundos (3-5s) antes de fornecer uma sugestão, criando oportunidade para que a criança inicie a comunicação de forma espontânea."}' > /dev/null
post "$TOKEN_ANA" POST "/criancas/$SOFIA_ID/glossario" \
  '{"termo":"Dieta Sensorial","definicao":"Programa personalizado de atividades e estratégias sensoriais planejadas ao longo do dia para ajudar a criança a manter um nível ótimo de alerta e autorregulação."}' > /dev/null

log "=== Glossário de Miguel ==="
post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/glossario" \
  '{"termo":"CAA de alta tecnologia","definicao":"Dispositivo eletrônico como tablet ou computador com software de comunicação que gera voz digitalizada ou sintetizada, permitindo à criança comunicar-se através de símbolos ou texto."}' > /dev/null
post "$TOKEN_BRUNO" POST "/criancas/$MIGUEL_ID/glossario" \
  '{"termo":"Roteiro Visual","definicao":"Sequência de imagens ou símbolos que representa os passos de uma atividade ou a ordem dos eventos do dia, facilitando a previsibilidade e a transição para crianças com necessidades de suporte."}' > /dev/null
post "$TOKEN_ANA" POST "/criancas/$MIGUEL_ID/glossario" \
  '{"termo":"Educação Inclusiva","definicao":"Modelo educacional em que crianças com e sem deficiência aprendem juntas na mesma sala, com adaptações e suportes para garantir participação plena de todos."}' > /dev/null

log ""
log "✅ Seed concluído!"
log "   Acesse o frontend em http://localhost:4200"
log "   Login: ana@caa.dev / senha123 (profissional)"
log "   Login: carla@caa.dev / senha123 (familiar)"
