# PATHWAY · Painéis de acompanhamento (MVP)

Site estático (HTML/CSS/JS puro, sem build) com três painéis:

| Página | O que é |
|---|---|
| `Dashboard.html` | App da dupla: importa o *Export Student List* (.xlsx/.csv) e guarda tudo no `localStorage` do navegador |
| `dashboards-mvp/lz.html` | Painel do LZ (uma zona) |
| `dashboards-mvp/lider.html` | Painel do líder (todas as zonas) |

> Todos os dados em `dados-demo/` e em `dashboards-mvp/comum.js` são **fictícios**.
> Nenhum dado de aluno sai do navegador: não há backend.

## Rodar localmente

```bash
python -m http.server 8765
```

Abra http://localhost:8765.

## Verificações (as mesmas do CI)

```bash
node scripts/check.mjs
npx html-validate@9 "*.html" "dashboards-mvp/*.html"
```

## CI/CD

- **CI** — GitHub Actions (`.github/workflows/ci.yml`) roda em todo push na `main` e em todo PR: sintaxe JS, links locais e validação HTML.
- **CD** — Vercel conectada ao repositório pela integração Git:
  - PR → deploy de *preview* com URL própria
  - merge na `main` → deploy de *produção*

Config em `vercel.json` (sem build, URLs limpas, cabeçalhos de segurança, `noindex`).
`.vercelignore` tira scripts e config do que vai para o ar.

## Dados de demonstração

`dados-demo/gerar_dados.py` regenera os exports e o backup fictícios:

```bash
uv run --no-project --with openpyxl python -I dados-demo/gerar_dados.py
```
