# PATHWAY · Painéis de acompanhamento (MVP)

**No ar:** https://pathwaydashboard.vercel.app/

Site estático (HTML/CSS/JS puro, sem build) com três painéis:

| Página | Link | O que é |
|---|---|---|
| `Dashboard.html` | [/Dashboard](https://pathwaydashboard.vercel.app/Dashboard) | App da dupla: importa o *Export Student List* (.xlsx/.csv) e guarda tudo no navegador |
| `dashboards-mvp/lz.html` | [/dashboards-mvp/lz](https://pathwaydashboard.vercel.app/dashboards-mvp/lz) | Painel do LZ (uma zona) |
| `dashboards-mvp/lider.html` | [/dashboards-mvp/lider](https://pathwaydashboard.vercel.app/dashboards-mvp/lider) | Painel do líder (todas as zonas) |

> Todos os dados em `dados-demo/` e em `dashboards-mvp/comum.js` são **fictícios**.
> Nenhum dado de aluno sai do navegador: não há backend.

## Como usar o app da turma (importar os .xlsx)

O app lê o **Export Student List** do Portal (o mesmo .xlsx/.csv que a dupla baixa) e monta o painel da turma.

### Importar uma lista

1. Abra https://pathwaydashboard.vercel.app/Dashboard e vá na aba **Dados**.
2. Arraste o arquivo para a área *"Solte aqui o arquivo do Portal"* ou clique em **Escolher arquivo**.
3. Pronto: o app mostra *"Lista atualizada: N alunos, X novos"* e preenche as abas **Painel**, **Alunos**, **Encontros** e **Contatos**.

O que a importação faz:

- Usa a **primeira aba** da planilha. As colunas são reconhecidas pelo nome do cabeçalho, em inglês ou português:
  `Full Name`, `Student Number`, `Gathering`, `Gender`, `Email (Contact)`, `Email Address 2`, `Mobile Phone`, `Age`, `Last Participation`, `City`, `Country`, `Is Member`.
- Identifica o aluno pelo **Student Number** (sem ele, pelo nome). Reimportar **atualiza** os dados e **preserva** contatos, presenças, status e notas já registrados.
- Quem aparece numa lista nova depois da primeira importação é marcado como **aluno novo**; quem some da lista fica como **fora da lista**.
- A data da importação é a **data de hoje**: o histórico de acesso ao Canvas cresce a cada importação, em dias diferentes. Recomendado: importar duas vezes por semana.
- Antes de cada importação o app guarda uma cópia automática (aba **Dados → Cópias automáticas**).

### Onde ficam os dados

Tudo fica no `localStorage` **deste navegador, neste computador**. Outro navegador ou outro computador começa vazio. Para levar os dados:

- **Dados → Baixar cópia (.json)** no computador de origem;
- **Dados → Restaurar de uma cópia** no destino.

**Dados → Apagar todos os dados** zera o app (útil para recomeçar a demo).

### Roteiro de demonstração com os arquivos de exemplo

Os arquivos de `dados-demo/` simulam a turma fictícia *PC 102 - Block 4* e podem ser baixados direto do site:

| Arquivo | Para que serve |
|---|---|
| [pc102-demo-backup.json](https://pathwaydashboard.vercel.app/dados-demo/pc102-demo-backup.json) | Turma já em uso: 5 importações, presenças e contatos registrados até 15/10/2026 |
| [export_01 … export_05](https://pathwaydashboard.vercel.app/dados-demo/export_05_2026-10-14.xlsx) (.xlsx) | As 5 listas semanais do Portal (24/09 a 14/10), 23 alunos |
| [export_06_2026-10-15.xlsx](https://pathwaydashboard.vercel.app/dados-demo/export_06_2026-10-15.xlsx) | Lista do dia da demo: a mesma do export_05 + **3 alunos novos** |

**Demo completa (recomendada):**

1. Baixe `pc102-demo-backup.json` e `export_06_2026-10-15.xlsx`.
2. No app, **Dados → Restaurar de uma cópia** e escolha o `.json`: o painel aparece com histórico, contatos e alertas.
3. Importe o `export_06_2026-10-15.xlsx`: o app avisa **3 novos** e eles aparecem com o selo de aluno novo.

**Começando do zero:** em um navegador sem dados, importe só o `export_05_2026-10-14.xlsx` para ver a turma montada a partir de uma lista. Importar os exports 01 a 05 em sequência no mesmo dia **não** recria o histórico semanal (todos ficam com a data de hoje); para isso use o backup `.json`.

> As datas da demo são de outubro de 2026. Os contadores de "dias sem Canvas" e "dias sem contato" são calculados a partir da data de hoje, então em outras datas os números mudam.

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
  - merge na `main` → deploy de *produção* em https://pathwaydashboard.vercel.app/

Config em `vercel.json` (sem build, URLs limpas, cabeçalhos de segurança, `noindex`).
`.vercelignore` tira scripts e config do que vai para o ar.

## Dados de demonstração

`dados-demo/gerar_dados.py` regenera os exports e o backup fictícios:

```bash
uv run --no-project --with openpyxl python -I dados-demo/gerar_dados.py
```
