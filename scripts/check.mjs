// Verificação do site estático (sem dependências): roda no CI e localmente com `node scripts/check.mjs`.
// 1. Sintaxe de todo JS (arquivos .js e <script> inline dos .html)
// 2. Links locais (href/src) apontam para arquivos que existem
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const IGNORAR = new Set(['.git', 'node_modules', '.vercel', '.github', '.claude', 'scripts']);
const erros = [];

function listar(dir) {
  return readdirSync(dir).flatMap((nome) => {
    if (IGNORAR.has(nome)) return [];
    const p = join(dir, nome);
    return statSync(p).isDirectory() ? listar(p) : [p];
  });
}

function compilar(codigo, origem) {
  try {
    new vm.Script(codigo, { filename: origem });
  } catch (e) {
    erros.push(`${origem}: erro de sintaxe JS: ${e.message}`);
  }
}

const arquivos = listar(ROOT);

for (const arq of arquivos.filter((f) => extname(f) === '.js')) {
  compilar(readFileSync(arq, 'utf8'), relative(ROOT, arq));
}

for (const arq of arquivos.filter((f) => extname(f) === '.html')) {
  const rel = relative(ROOT, arq);
  const html = readFileSync(arq, 'utf8');

  let n = 0;
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] || '';
    if (/\bsrc=/.test(attrs) || /type=["'](?!text\/javascript)/.test(attrs)) continue;
    compilar(m[2], `${rel} <script #${++n}>`);
  }

  for (const m of html.matchAll(/\b(?:href|src)=["']([^"'#?]+)/gi)) {
    const alvo = m[1];
    if (/^([a-z]+:|\/\/|\$\{)/i.test(alvo)) continue; // externo, mailto:, ou template JS
    if (!existsSync(join(dirname(arq), alvo))) erros.push(`${rel}: link quebrado -> ${alvo}`);
  }
}

if (erros.length) {
  console.error(erros.join('\n'));
  console.error(`\n${erros.length} problema(s) encontrado(s).`);
  process.exit(1);
}
console.log(`OK: ${arquivos.length} arquivos verificados.`);
