/* ============================================================
   Painéis do LZ e do Líder: dados SIMULADOS + regras dos KPIs
   Nenhum nome é real. Os números só mostram o formato.

   O que cada dupla enviaria por semana (só números, sem nomes de alunos):
   total, ativos, emDia, faltou, seguidas, semCanvas, contatados
   ============================================================ */
const HOJE = '2026-10-15';
const SEMANAS = ['2026-09-09','2026-09-16','2026-09-23','2026-09-30','2026-10-07','2026-10-14'];
const W = SEMANAS.length - 1;                // semana atual (a última fechada)
const REGRAS = {
  emDiaVermelho: 70, emDiaAmarelo: 85,       // % dos ativos que estão em dia
  contatoVermelho: 50, contatoAmarelo: 80,   // % dos alunos em alerta contatados nos últimos 7 dias
  diasSemAtualizar: 7,                       // dados mais velhos que isso não entram na régua de apoio
  metaAtivos: 90, metaCanvas: 85, metaPresenca: 85   // referências sugeridas, mostradas como marca nas barras
};

/* ---------- zonas e duplas (fictícias) ----------
   A Zona Sul reproduz a tabela da proposta, com "alertas" corrigidos para fechar a conta. */
const ZONAS = [
  { id:'sul', nome:'Zona Sul', lz:'Casal Moraes', duplas:[
    { casal:'Casal Almeida',   turma:'PC 101', atualizado:'2026-10-14', fim:{total:26, desist:2, emDia:19, faltou:5, seguidas:1, semCanvas:3, contatados:4} },
    { casal:'Casal Brandão',   turma:'PC 102', atualizado:'2026-10-14', fim:{total:23, desist:2, emDia:15, faltou:6, seguidas:3, semCanvas:3, contatados:0} },
    { casal:'Casal Cordeiro',  turma:'PC 103', atualizado:'2026-10-13', fim:{total:12, desist:0, emDia:11, faltou:1, seguidas:0, semCanvas:0, contatados:1} },
    { casal:'Casal Damasceno', turma:'PC 101', atualizado:'2026-10-14', fim:{total:33, desist:5, emDia:20, faltou:8, seguidas:4, semCanvas:6, contatados:3} },
  ]},
  { id:'norte', nome:'Zona Norte', lz:'Casal Vasconcelos', vies:0.02, duplas:[
    { casal:'Casal Teixeira', turma:'PC 101', atualizado:'2026-10-14' },
    { casal:'Casal Rezende',  turma:'PC 102', atualizado:'2026-10-02' },   // não atualiza há quase 2 semanas
    { casal:'Casal Moura',    turma:'PC 103', atualizado:'2026-10-14' },
  ]},
  { id:'leste', nome:'Zona Leste', lz:'Casal Pacheco', vies:0.07, duplas:[
    { casal:'Casal Fontes',   turma:'PC 101', atualizado:'2026-10-14' },
    { casal:'Casal Guerra',   turma:'PC 101', atualizado:'2026-10-13' },
    { casal:'Casal Lacerda',  turma:'PC 102', atualizado:'2026-10-14' },
    { casal:'Casal Nóbrega',  turma:'PC 103', atualizado:'2026-10-14' },
    { casal:'Casal Prado',    turma:'PC 102', atualizado:'2026-10-14' },
  ]},
  { id:'oeste', nome:'Zona Oeste', lz:'Casal Siqueira', vies:-0.05, duplas:[
    { casal:'Casal Quintana', turma:'PC 101', atualizado:'2026-10-14' },
    { casal:'Casal Ribeiro',  turma:'PC 102', atualizado:'2026-10-14' },
    { casal:'Casal Sampaio',  turma:'PC 103', atualizado:'2026-10-12' },
    { casal:'Casal Toledo',   turma:'PC 101', atualizado:'2026-10-14' },
  ]},
];

/* ---------- gerador determinístico (mesmos números a cada abertura) ---------- */
function sorteio(seed){
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const limita = (v, a, b) => Math.min(b, Math.max(a, v));

function gerarFim(r, vies){
  const total = 12 + Math.floor(r() * 23);
  const desist = Math.floor(r() * Math.min(5, total * 0.15));
  const ativos = total - desist;
  const emDia = Math.round(ativos * limita(0.74 + r() * 0.22 + vies, 0.5, 0.97));
  const alertas = ativos - emDia;
  const faltou = limita(Math.round(alertas * (0.5 + r() * 0.5)), alertas ? 1 : 0, alertas);
  return {
    total, desist, emDia, faltou,
    seguidas:   Math.round(faltou * r() * 0.6),
    semCanvas:  Math.round(alertas * (0.3 + r() * 0.5)),
    contatados: Math.round(alertas * limita(0.5 + r() * 0.5 + vies * 3, 0, 1)),
  };
}

/* histórico de 6 semanas que termina exatamente nos números finais da dupla */
function montarHistorico(d, r){
  const f = d.fim, n = SEMANAS.length;
  const ativosFim = f.total - f.desist, alertasFim = ativosFim - f.emDia;
  const pctFim = f.emDia / ativosFim;
  const pctIni = limita(pctFim + (r() * 0.22 - 0.06), 0.55, 0.97);
  const cFim = alertasFim ? f.contatados / alertasFim : 1, cIni = 0.2 + r() * 0.6;
  const razao = (a, b, padrao) => b ? a / b : padrao;
  const rf = razao(f.faltou, alertasFim, 0.75), rs = razao(f.seguidas, f.faltou, 0.3), rc = razao(f.semCanvas, alertasFim, 0.5);
  const hist = SEMANAS.map((sem, w) => {
    if(w === n - 1) return { sem, total:f.total, ativos:ativosFim, emDia:f.emDia, faltou:f.faltou,
                             seguidas:f.seguidas, semCanvas:f.semCanvas, contatados:f.contatados };
    const t = w / (n - 1);
    const ativos  = f.total - Math.round(f.desist * t);
    const emDia   = limita(Math.round(ativos * (pctIni + (pctFim - pctIni) * t + (r() - 0.5) * 0.04)), 0, ativos);
    const alertas = ativos - emDia;
    const faltou  = limita(Math.round(alertas * rf), 0, alertas);
    return { sem, total:f.total, ativos, emDia, faltou,
             seguidas:   w === 0 ? 0 : limita(Math.round(faltou * rs), 0, faltou),
             semCanvas:  limita(Math.round(alertas * rc), 0, alertas),
             contatados: limita(Math.round(alertas * (cIni + (cFim - cIni) * t)), 0, alertas) };
  });
  // dupla desatualizada: as semanas depois do último envio repetem o último número conhecido
  const ultimo = SEMANAS.reduce((acc, s, i) => s <= d.atualizado ? i : acc, 0);
  return hist.map((h, i) => i > ultimo ? {...hist[ultimo], sem:h.sem} : h);
}

ZONAS.forEach((z, zi) => z.duplas.forEach((d, di) => {
  const r = sorteio(1000 + zi * 37 + di * 11);
  if(!d.fim) d.fim = gerarFim(r, z.vies || 0);
  d.zona = z;
  d.hist = montarHistorico(d, r);
}));

/* ============================================================
   Regras dos KPIs
   ============================================================ */
const pct = (a, b) => b ? Math.round(a / b * 100) : null;

/* Soma os números das duplas numa semana. Porcentagens saem SEMPRE da soma
   (numeradores ÷ denominadores), nunca da média das porcentagens das duplas. */
function somar(duplas, w){
  const k = { duplas:duplas.length, total:0, ativos:0, emDia:0, faltou:0, seguidas:0, semCanvas:0, contatados:0, presP:0, presM:0 };
  for(const d of duplas){
    const s = d.hist[w];
    for(const c of ['total','ativos','emDia','faltou','seguidas','semCanvas','contatados']) k[c] += s[c];
    // presença geral do bloco: todas as presenças ÷ todas as marcações até esta semana
    for(let i = 0; i <= w; i++){ k.presP += d.hist[i].ativos - d.hist[i].faltou; k.presM += d.hist[i].ativos; }
  }
  k.alertas = k.ativos - k.emDia;            // em alerta = vermelho + amarelo
  k.canvas  = k.ativos - k.semCanvas;        // acessaram o Canvas nos últimos 7 dias
  return k;
}

function diasDesde(iso){ return Math.round((new Date(HOJE + 'T00:00:00') - new Date(iso + 'T00:00:00')) / 86400000); }
function desatualizada(d){ return diasDesde(d.atualizado) > REGRAS.diasSemAtualizar; }

const NIVEL = { red:'Precisa de apoio', yel:'Acompanhar', grn:'Tudo bem', gry:'Sem dados recentes' };
const ORDEM_NIVEL = { red:0, gry:1, yel:2, grn:3 };

/* Régua de apoio: olha o resultado (em dia) e a ação da dupla (alertas contatados) */
function apoio(k, dupla){
  if(dupla && desatualizada(dupla))
    return { nivel:'gry', motivos:[`os últimos números chegaram em ${dataBR(dupla.atualizado)}`] };
  const emDia = pct(k.emDia, k.ativos), cont = k.alertas ? pct(k.contatados, k.alertas) : 100;
  const R = REGRAS, red = [], yel = [];
  const tEmDia = `${emDia}% dos alunos em dia (meta: ${R.emDiaAmarelo}%)`, tCont = `${cont}% dos alertas com contato (meta: ${R.contatoAmarelo}%)`;
  if(emDia < R.emDiaVermelho) red.push(tEmDia);
  else if(emDia < R.emDiaAmarelo) yel.push(tEmDia);
  if(cont < R.contatoVermelho) red.push(tCont);
  else if(cont < R.contatoAmarelo) yel.push(tCont);
  if(red.length) return { nivel:'red', motivos:red.concat(yel) };
  if(yel.length) return { nivel:'yel', motivos:yel };
  return { nivel:'grn', motivos:['as duas metas foram atingidas'] };
}

/* ============================================================
   Utilidades de tela, pensadas para quem serve e não é analista:
   frases em vez de siglas, "X de Y" em vez de fórmulas,
   pessoas desenhadas em vez de linhas e sempre um "o que fazer".
   ============================================================ */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dataBR(iso){ const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; }
function dataCurta(iso){ return `${iso.slice(8)}/${iso.slice(5,7)}`; }
const fmt = n => n.toLocaleString('pt-BR');
const plural = (n, um, varios) => `${fmt(n)} ${n === 1 ? um : varios}`;
const emCada10 = p => Math.round(p / 10);
function pillNivel(a){ return `<span class="sinal ${a.nivel}">${NIVEL[a.nivel]}</span>`; }

/* comparação com a semana passada em português simples; seta + palavra, nunca só a cor */
function mudanca(atual, antes, melhorSeSobe, formato = v => fmt(v)){
  if(atual === antes) return `<p class="mud">= Igual à semana passada</p>`;
  const bom = (atual > antes) === melhorSeSobe;
  return `<p class="mud"><span class="${bom ? 'bom' : 'ruim'}">${atual > antes ? '▲' : '▼'} ${bom ? 'Melhorou' : 'Piorou'}</span> · na semana passada: ${formato(antes)}</p>`;
}

/* ---------- quatro grupos de alunos, usados no desenho de pessoas ---------- */
const GRUPOS = [
  { id:'emDia',      cls:'grn', rot:'Em dia',                       dica:'Acessando o Canvas e vindo aos encontros.' },
  { id:'contatados', cls:'yel', rot:'Em alerta, já contatados',     dica:'Têm algum alerta, mas a dupla falou com eles nos últimos 7 dias.' },
  { id:'semContato', cls:'red', rot:'Em alerta, ainda sem contato', dica:'Ninguém falou com eles nos últimos 7 dias. É aqui que a ajuda faz diferença.' },
  { id:'desist',     cls:'gry', rot:'Desistiram',                   dica:'Saíram do curso neste bloco.' },
];
function grupos(k){ return { emDia:k.emDia, contatados:k.contatados, semContato:k.alertas - k.contatados, desist:k.total - k.ativos }; }

function legenda(valores, texto){
  return `<ul class="leg">${GRUPOS.map(G => `<li><i class="p ${G.cls}"></i><div><b>${texto(valores[G.id], G)}</b><small>${G.dica}</small></div></li>`).join('')}</ul>`;
}

/* LZ: um ponto para cada aluno da zona */
function pessoas(k){
  const g = grupos(k);
  const pontos = GRUPOS.map(G => `<i class="p ${G.cls}" data-tip="${esc(`${G.rot}: ${g[G.id]}`)}"></i>`.repeat(g[G.id])).join('');
  return `<div class="pessoas" role="img" aria-label="${esc(GRUPOS.map(G => `${g[G.id]} ${G.rot.toLowerCase()}`).join(', '))}">${pontos}</div>
          ${legenda(g, (n, G) => `${fmt(n)} ${G.rot.toLowerCase()}`)}`;
}

/* Líder: 100 quadradinhos = "de cada 100 alunos" (o resto maior garante que somam 100) */
function cemAlunos(k){
  const g = grupos(k);
  const brutos = GRUPOS.map(G => g[G.id] / k.total * 100);
  const casas = brutos.map(Math.floor);
  const falta = 100 - casas.reduce((a, b) => a + b, 0);
  brutos.map((b, i) => [b - Math.floor(b), i]).sort((a, b) => b[0] - a[0]).slice(0, falta).forEach(([, i]) => casas[i]++);
  const por = {}; GRUPOS.forEach((G, i) => por[G.id] = casas[i]);
  const quadros = GRUPOS.map((G, i) =>
    `<i class="q ${G.cls}" data-tip="${esc(`${G.rot}: ${casas[i]} em cada 100\n(${fmt(g[G.id])} alunos)`)}"></i>`.repeat(casas[i])).join('');
  return `<div class="waffle" role="img" aria-label="${esc(GRUPOS.map((G, i) => `${casas[i]} em cada 100 ${G.rot.toLowerCase()}`).join(', '))}">${quadros}</div>
          ${legenda(por, (n, G) => `${n} em cada 100 · ${G.rot.toLowerCase()}`)}`;
}

/* barra de progresso com a marca da meta; modo 'num' mostra "19 de 24", modo 'pct' mostra "79%" */
function barra({rot, n, de, meta = null, modo = 'num', vazio = 'ninguém nessa situação'}){
  if(!de) return `<div class="barra-bloco"><div class="barra-topo"><span>${rot}</span><b class="muted">${vazio}</b></div><div class="barra"><i style="width:100%"></i></div></div>`;
  const p = pct(n, de);
  const valor = modo === 'pct' ? `${p}%` : `${fmt(n)} de ${fmt(de)}`;
  const abaixo = meta != null && p < meta;
  return `<div class="barra-bloco">
      <div class="barra-topo"><span>${rot}</span><b>${valor}${abaixo ? ' <em>abaixo da meta</em>' : ''}</b></div>
      <div class="barra" data-tip="${esc(`${rot}: ${fmt(n)} de ${fmt(de)} (${p}%)${meta != null ? `\nMeta sugerida: ${meta}%` : ''}`)}">
        <i style="width:${p}%"></i>${meta != null ? `<s style="left:${meta}%"></s>` : ''}
      </div>
    </div>`;
}

/* colunas semanais (começam do zero), última semana em destaque, linha tracejada da meta */
function colunas({valores, tips, meta, rotulo}){
  const w = 560, h = 190, pl = 8, pr = 64, pt = 24, pb = 30, n = valores.length;
  const passo = (w - pl - pr) / n, larg = Math.min(46, passo * 0.58);
  const y = v => pt + (100 - v) / 100 * (h - pt - pb), base = y(0);
  let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(rotulo)}">`;
  s += `<line class="eixo" x1="${pl}" x2="${w - pr}" y1="${base}" y2="${base}"/>`;
  if(meta != null) s += `<line class="meta" x1="${pl}" x2="${w - pr}" y1="${y(meta)}" y2="${y(meta)}"/><text class="meta-rot" x="${w - pr + 6}" y="${y(meta) + 4}">meta ${meta}%</text>`;
  valores.forEach((v, i) => {
    const cx = pl + passo * i + passo / 2, x0 = cx - larg / 2, topo = y(v), r = Math.min(4, (base - topo) / 2);
    const atual = i === n - 1;
    s += `<g class="col" data-tip="${esc(tips[i])}">
      <rect class="alvo" x="${pl + passo * i}" y="0" width="${passo}" height="${h}"/>
      <path class="${atual ? 'barra-atual' : 'barra-antes'}" d="M${x0} ${base}V${topo + r}Q${x0} ${topo} ${x0 + r} ${topo}H${x0 + larg - r}Q${x0 + larg} ${topo} ${x0 + larg} ${topo + r}V${base}Z"/>
      <text class="${atual ? 'val-atual' : 'val'}" x="${cx}" y="${topo - 7}" text-anchor="middle">${v}%</text>
      <text class="sem" x="${cx}" y="${h - 10}" text-anchor="middle">${atual ? 'esta semana' : dataCurta(SEMANAS[i])}</text>
    </g>`;
  });
  return s + '</svg>';
}

/* duas tendências em colunas: o resultado (em dia) e a ação (contatos) */
function tendencias(duplas){
  const ks = SEMANAS.map((_, w) => somar(duplas, w));
  const g = (titulo, sub, num, den, meta, palavra) => {
    const valores = ks.map(k => pct(num(k), den(k)) ?? 100);
    const tips = ks.map((k, i) => `Semana de ${dataBR(SEMANAS[i])}\n${fmt(num(k))} de ${fmt(den(k))} ${palavra} (${valores[i]}%)`);
    return `<div class="graf"><h3>${titulo}</h3><p>${sub}</p>${colunas({valores, tips, meta, rotulo:`${titulo}: ${valores.join('%, ')}%`})}</div>`;
  };
  return g('Alunos em dia', 'De cada 100 alunos ativos, quantos estavam sem nenhum alerta.',
           k => k.emDia, k => k.ativos, REGRAS.emDiaAmarelo, 'em dia')
       + g('Alertas que receberam contato', 'De cada 100 alunos em alerta, com quantos a dupla falou na semana.',
           k => k.contatados, k => k.alertas, REGRAS.contatoAmarelo, 'contatados');
}

/* frase de ação para o LZ, a partir dos números da dupla */
function acaoDupla(d, kd, ap){
  const semContato = kd.alertas - kd.contatados;
  if(ap.nivel === 'gry') return `Pergunte ao ${d.casal} se está conseguindo importar a lista do Portal e fazer a chamada. Os números são de ${dataBR(d.atualizado)}.`;
  if(semContato > 0) return `${plural(semContato, 'aluno em alerta ainda não recebeu', 'alunos em alerta ainda não receberam')} contato. Combine com o ${d.casal} quem vai ligar para cada um.`;
  if(kd.seguidas > 0) return `${plural(kd.seguidas, 'aluno faltou', 'alunos faltaram')} 2 ou mais encontros seguidos. Sugira uma visita ou uma ligação.`;
  return `Tudo em dia. Vale um elogio ao ${d.casal}!`;
}

/* frase de ação para o líder, a partir dos números da zona */
function acaoZona(z, kz, ns){
  const red = ns.filter(n => n === 'red').length, gry = ns.filter(n => n === 'gry').length;
  const semContato = kz.alertas - kz.contatados;
  const partes = [];
  if(red) partes.push(plural(red, 'dupla que precisa', 'duplas que precisam') + ' de apoio');
  if(gry) partes.push(plural(gry, 'dupla sem dados recentes', 'duplas sem dados recentes'));
  if(partes.length) return `Converse com o ${z.lz} (LZ) sobre ${partes.join(' e ')}. Há ${plural(semContato, 'aluno em alerta', 'alunos em alerta')} sem contato na zona.`;
  if(semContato > 0) return `${plural(semContato, 'aluno em alerta ainda está', 'alunos em alerta ainda estão')} sem contato. O ${z.lz} (LZ) já está acompanhando.`;
  return `Zona em dia. Vale reconhecer o trabalho do ${z.lz} (LZ) e das duplas.`;
}

/* tooltip único para todos os desenhos */
document.addEventListener('mousemove', e => {
  const tip = document.getElementById('tip'); if(!tip) return;
  const alvo = e.target.closest && e.target.closest('[data-tip]');
  if(!alvo){ tip.hidden = true; return; }
  tip.textContent = alvo.dataset.tip; tip.hidden = false;
  const r = tip.getBoundingClientRect();
  let px = e.clientX + 14, py = e.clientY + 14;
  if(px + r.width > innerWidth - 8) px = e.clientX - r.width - 14;
  if(py + r.height > innerHeight - 8) py = e.clientY - r.height - 14;
  tip.style.left = px + 'px'; tip.style.top = py + 'px';
});
