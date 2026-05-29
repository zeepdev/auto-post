# 📈 Progress — auto-post

> Log cronológico: o que foi feito, erros, testes e resultados. Mais recente no topo de cada dia.

---

## 2026-05-29
- Projeto `auto-post` criado dentro de `automacao/`.
- Estrutura de pastas: `architecture/`, `tools/`.
- Documentos de IA criados seguindo o Protocolo 0 do V.L.A.E.G.:
  - `protocolo_vlaeg.md` (cópia do protocolo)
  - `gemini.md` (constituição — em modo inicialização)
  - `task_plan.md` (fases e checklist)
  - `findings.md` (vazio)
  - `progress.md` (este arquivo)
- **Status:** aguardando Descoberta (Fase V).

### 2026-05-29 (cont.) — Descoberta respondida via `/goal` → MVP construído
- Escopo definido: gerador web de posts/carrosséis pro Instagram, guiado por referências.
- Stack escolhida: React 18 + Vite + react-konva + zustand. **Sem backend** — análise de referência (paleta) roda client-side; cobre o requisito de "sugestão a partir de referência" sem CLIP/DALL·E (decisão registrada em `gemini.md` §5).
- Schema do projeto definido em `gemini.md` §2.
- Implementado:
  - Store zustand com projeto/slides/elementos + persistência em localStorage.
  - `lib/colors.js` (extração de paleta dominante por quantização de pixels), `lib/stage.js` (tamanho lógico + pixelRatio de export), `lib/exporter.js` (PNG/JPG em 1080px, slide único e carrossel em sequência), `lib/templates.js` (4 templates), `lib/fonts.js` (8 Google Fonts).
  - Componentes: Header (export PNG/JPG), LeftPanel (formato, referências, paleta, imagem, templates), CanvasStage (Stage + Transformer, drag/resize/rotate, escala visual por CSS), RightPanel (inspector completo de texto/forma/imagem), SlideStrip (miniaturas do carrossel).
  - Atalho Delete/Backspace, deseleção no fundo, layout responsivo (3 painéis → empilhado em <1000px).
- **Validação:** `npm install` OK (72 pkgs). `npm run build` OK (241 módulos, ~6.7s). `npm run dev` serve HTTP 200 em localhost:5174.
- **Pendências/ideias futuras:** edição de texto inline no canvas (hoje é pelo painel direito); export em ZIP único; biblioteca de ícones; análise semântica de layout (não só cor) da referência. Ver `task_plan.md` Fase E/G.

### 2026-05-29 (cont. 2) — IA generativa + Logo/Identidade + Pacotes de referência
- Decisões (via `/goal` + AskUserQuestion): IA roda **Claude API no navegador** (chave Anthropic no localStorage), provider Anthropic, usuário escolhe na hora post vs carrossel.
- **Logo & Identidade** (`LeftPanel` → LogoSection): sobe logo → extrai paleta → `buildIdentity()` deriva {background, textColor, accent} → "Usar identidade" aplica no projeto; "Inserir na arte" coloca o logo como imagem; logos persistem em localStorage (`auto-post:logos:v1`).
- **IA / Contexto** (nova aba via tabs no LeftPanel → `ContextPanel`): campo de chave, textarea de briefing, anexar foto/documento (imagem → visão; .txt/.md/.csv → vira texto; PDF ainda não), seleção post/carrossel + nº de páginas, seleção de logo.
  - `lib/ai.js`: `generateSpec()` chama Anthropic `messages` (modelo `claude-sonnet-4-6`) com header `anthropic-dangerous-direct-browser-access` e **tool use** (`create_post`) forçado → devolve spec estruturado {identity, slides[]}.
  - `lib/layoutEngine.js`: `specToSlides()` converte o spec em slides posicionados (layout determinístico por kind: cover/content/cta) + insere logo. Princípio VLAEG: IA faz texto, layout é determinístico.
  - `applyGenerated()` substitui os slides pelo resultado.
- **Pacotes de referência** (`LeftPanel` → PackageSection): sobe N imagens, nomeia (ex "Pacote 1"), salva (extrai paleta agregada). Persistem em `auto-post:packages:v1`. Reutilizáveis: "usar paleta" no Design e seleção de pacote no ContextPanel (entra como imagens de contexto pra IA).
- **Validação:** `npm run build` OK (244 módulos). `npm run dev` serve todos os módulos HTTP 200, sem erros no log.
- **Nota de segurança:** chave de API fica no navegador (localStorage) — ok pra uso pessoal. Se for publicar pra terceiros, migrar pra backend (registrado em `findings.md`).

### 2026-05-29 (cont. 3) — Backend serverless (Vercel) + Login sem DB
- Decisão (AskUserQuestion): **backend guarda a chave** (seguro) + deploy na **Vercel**. Motivo: o dono vai publicar o site → chave no frontend seria exposta.
- **Backend `api/`** (serverless Node, ESM):
  - `api/_lib/auth.js`: credenciais via `AUTH_USERS`/`AUTH_USERNAME+PASSWORD`; token stateless HMAC-SHA256 (`AUTH_SECRET`), TTL 12h; comparação timing-safe.
  - `api/_lib/anthropic.js`: chama Claude (`claude-sonnet-4-6`) server-side com `ANTHROPIC_API_KEY`, tool use `create_post`. Chave nunca no client.
  - `api/_lib/http.js`: readJson/send/cors/getBearer (compatível Vercel + dev).
  - `api/login.js` (POST → token) e `api/generate.js` (Bearer obrigatório → spec). `_lib` não vira rota (prefixo `_`).
- **Frontend:** `lib/api.js` (login/generate/sessão em localStorage), `components/Login.jsx` (gate), App bloqueia se sem token, Header tem "Sair". ContextPanel agora chama o backend (sem campo de chave) e faz `downscaleDataURL` nas imagens antes de enviar. Removido `lib/ai.js` (client) — obsoleto.
- **Dev local:** `dev-server.js` (http puro, dotenv) roda os handlers; Vite faz proxy `/api`→3000; `npm run dev` sobe ambos via `concurrently`. Deps novas: concurrently, dotenv.
- **Deploy:** `vercel.json` (maxDuration 60s). `.env.example` documenta as env vars. Mesmas vars devem ir em Vercel → Settings → Environment Variables.
- **Validação E2E local:** login OK (retorna token); senha errada→401; `/api/generate` sem token→401; com token + chave fake→chega na Claude (erro "invalid x-api-key", esperado). `npm run build` OK (245 módulos). Pipeline de auth+proxy 100% funcional; só falta a chave real pra gerar de verdade.
- **Deploy concluído pelo dono na Vercel; funcionando.** Repo em github.com/zeepdev/auto-post.

### 2026-05-29 (cont. 4) — Editor avançado: reflow, undo/redo, guias, marca, elementos
- **Formato quadrado 1080×1080** adicionado (`FORMATS.square`).
- **Reflow ao trocar de formato** (`reflowSlides` no store): posições escalam por eixo, fontSize/tamanhos pela largura — a arte se adapta em vez de manter coords fixas.
- **Undo/Redo** (store `past`/`future`, limite 60): `update()` empilha snapshot quando slides/format mudam; `undo`/`redo` usam `set` direto (não re-empilham). Botões no Header + atalhos Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z no App.
- **Guias de centralização** ("trava"): `CanvasStage.onDragMove` usa `getClientRect` pra detectar centro do elemento perto do centro do stage (tolerância 6px), faz snap e mostra linha-guia rosa (X e Y).
- **Identidade da marca**: `brandColors` (persist `auto-post:brand:v1`) com add/editar/remover (`BrandSection`). Têm prioridade em templates e na geração por IA.
- **Biblioteca de elementos:** novos tipos `circle`, `triangle`, `icon` (além de rect). Geometria compartilhada em `lib/shapes.js`; ícones curados em `lib/icons.js` (13 ícones, viewBox 24). Render no canvas via Group (origem top-left, drag/transform unificados) e no `exporter` via Konva puro. `ElementsSection` (LeftPanel) + botões no RightPanel + troca de ícone no inspector.
- **IA enriquece a arte:** tool schema ganhou `decorations` (shape/icon + coords relativas 0–1 + cor); `layoutEngine.decoToElement` converte (decorações ficam atrás do texto). `ICON_NAMES` em `api/_lib/anthropic.js` espelha `icons.js` (manter em sincronia).
- **IA com seletor de formato** (ContextPanel) — gera direto em feed/quadrado/story; `applyGenerated` agora também troca o formato do projeto.
- **Validação:** `npm run build` OK (247 módulos); dev (web+API) sobe limpo; módulos e proxy `/api` retornam 200; login via proxy OK.

### 2026-05-29 (cont. 5) — Guias inteligentes, zoom e layout premium da IA
- **Alinhamento inteligente tipo Canva** (`lib/snapping.js` + `CanvasStage.onDragMove`): ao arrastar, faz snap a bordas/centro de OUTROS elementos, ao centro do canvas e às margens de segurança (5%); desenha linhas-guia rosas. Substitui o snap só-de-centro anterior. Usa `getClientRect` (cobre rotação/escala).
- **Zoom**: `fitScale × zoom`; barra flutuante (−/%/+, clique no % = ajustar) + Ctrl/⌘ + scroll. `.canvas-wrap` com overflow auto pra rolar quando ampliado. Espessura das guias compensa o zoom (`1/scale`).
- **Layout premium da IA** (`layoutEngine` cover): círculo de fundo esmaecido (opacity 0.1), aspas grandes (Playfair) topo-esq e base-dir, barra de destaque, headline Bebas maior. Prompt do `anthropic.js` pede UMA decoração grande esmaecida (pilar/engrenagem) de fundo + detalhes nos cantos — aproxima do nível da referência (Athena/Grand Vista).
- **Cor dos elementos** confirmada no inspector pra rect/circle/triangle/icon (e troca de ícone). 
- **Validação:** `npm run build` OK (248 módulos); dev sobe limpo; módulos novos 200.
- **Limite conhecido:** logos e fotos específicas (ex: coluna 3D) precisam ser enviados como assets; a IA usa a biblioteca de ícones/formas + imagens anexadas, não recria fotos.
