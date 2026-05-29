# 🏛️ Gemini — Constituição do Projeto **auto-post**

> Este é o documento-lei do projeto. `gemini.md` é a lei; os arquivos de planejamento (`task_plan.md`, `findings.md`, `progress.md`) são a memória.
> Regido pelo **[Protocolo V.L.A.E.G.](protocolo_vlaeg.md)**.

---

## ✅ ESTADO ATUAL: CONSTRUÇÃO (Fase A — Arquitetura)

Descoberta respondida via `/goal` em 2026-05-29. Esquema definido abaixo. Construindo o app.

**Stack final escolhida:** React + Vite + **react-konva** (canvas). Análise de referência (paleta) client-side. **Backend serverless na Vercel (`/api`)** pra IA generativa + login — a chave da Anthropic e as credenciais ficam só no servidor (env vars).

---

## 🔁 Como Retomar o Projeto (qualquer modelo/IA)

Se você é uma IA recém-chamada para continuar este projeto, **leia nesta ordem**:
1. **`protocolo_vlaeg.md`** — o método de trabalho (obrigatório).
2. **`gemini.md`** (este arquivo) — constituição, schemas e regras.
3. **`findings.md`** — descobertas, restrições, decisões técnicas.
4. **`task_plan.md`** — checklist do que está feito vs. pendente.
5. **`progress.md`** — log cronológico detalhado.

**Antes de mudar código:** confirme que o estado descrito ainda bate com o código atual.
**Ao terminar uma tarefa:** anote em `progress.md`, atualize `task_plan.md`, e atualize `gemini.md`/`findings.md` se mudou schema, regra ou arquitetura.

---

## 1. Visão (Estrela Guia)

**Gerador de posts e carrosséis para Instagram**, web, totalmente personalizável e guiado por referências visuais enviadas pelo usuário. Resultado único: o usuário sobe referências → ajusta textos/cores/fontes no canvas → baixa as artes em PNG/JPG em alta (1080px).

Formatos: **1080×1350** (feed vertical) e **1080×1920** (story/reel). Posts simples e carrosséis (múltiplos slides).

---

## 2. Esquemas de Dados (Data Schema)

### Modelo de Projeto (estado em memória, persiste no localStorage)
```json
{
  "format": { "key": "feed", "w": 1080, "h": 1350 },
  "currentIndex": 0,
  "slides": [
    {
      "id": "string",
      "background": "#0E1116",
      "elements": [
        {
          "id": "string",
          "type": "text | image | rect",
          "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "opacity": 1,
          "text": "string", "fontFamily": "Inter", "fontSize": 48,
          "fill": "#FFFFFF", "align": "left", "fontStyle": "normal",
          "lineHeight": 1.2, "letterSpacing": 0,
          "src": "dataURL", "cornerRadius": 0
        }
      ]
    }
  ]
}
```

### Payload de Entrada (referência)
Imagem(ns) `File` (PNG/JPG) → extração client-side de **paleta dominante** (array de hex) usada para sugerir background/cores de texto.

### Payload de Saída (entrega)
Arquivos **PNG/JPG a 1080px de largura** (`stage.toDataURL` com `pixelRatio` calculado). Carrossel = downloads em sequência (`slide-1.png`, `slide-2.png`, ...).

---

## 3. Regras Comportamentais

- **Comunicação com o dono:** PT-BR, informal, direto, opções claras nos trade-offs. Pergunta antes de instalar pacotes pesados ou ações destrutivas.
- **Confiabilidade > velocidade.** Lógica determinística; sem chamada de LLM em runtime.
- **UX:** preview em tempo real, feedback visual imediato, responsivo desktop+mobile.

---

## 4. Invariantes Arquiteturais

- **Frontend** React/Vite, estado no store (zustand), persistido em `localStorage`. Canvas via react-konva (design em escala de tela, export em alta via `pixelRatio`). Paleta extraída no navegador.
- **Backend serverless** em `api/` (Vercel): `api/login.js` (auth) e `api/generate.js` (IA). Lib compartilhada em `api/_lib/` (prefixo `_` → não vira rota na Vercel).
- **Segredos só no servidor** (env vars): `ANTHROPIC_API_KEY`, `AUTH_USERS`, `AUTH_SECRET`. NUNCA embutir chave no frontend.
- **Auth sem banco:** token stateless assinado com HMAC (`AUTH_SECRET`), validade 12h. Credenciais em `AUTH_USERS="user:senha,..."`. O frontend guarda o token no `localStorage` e manda em `Authorization: Bearer`.
- **IA determinística no layout:** a Claude (server-side, tool use) só devolve conteúdo; `lib/layoutEngine.js` posiciona. Imagens de contexto passam por `downscaleDataURL` antes do upload.
- **Dev local:** `dev-server.js` roda os mesmos handlers; Vite faz proxy de `/api` → `localhost:3000`. `npm run dev` sobe os dois (concurrently).

---

## 5. Stack & Integrações

- **Front-end:** React 18 + Vite + react-konva + konva. Estado: zustand.
- **Fontes:** Google Fonts (Inter, Poppins, Montserrat, Playfair Display, Oswald, Bebas Neue, Lora, Roboto) carregadas no `index.html`.
- **Backend/IA:** nenhum (decisão: análise de paleta client-side cobre o requisito de "sugestão a partir de referência" sem custo/chaves). Reavaliar se quiser análise semântica de layout.
- **Deploy alvo:** estático (Vercel/Netlify) — `npm run build` → `dist/`.

### Estrutura de código
```
auto-post/
├── index.html            ← fontes + root
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx           ← layout 3 painéis
    ├── styles.css
    ├── store.js          ← zustand (projeto, slides, elementos, seleção)
    ├── lib/
    │   ├── colors.js     ← extração de paleta dominante
    │   ├── fonts.js      ← catálogo de fontes
    │   ├── templates.js  ← templates pré-definidos
    │   └── exporter.js   ← download PNG/JPG (1 ou N slides)
    └── components/
        ├── Header.jsx
        ├── LeftPanel.jsx     ← upload referências + paleta + templates
        ├── CanvasStage.jsx   ← Stage react-konva + Transformer
        ├── RightPanel.jsx    ← inspector do elemento + formato + fundo
        └── SlideStrip.jsx    ← miniaturas do carrossel
```

---

## 6. Log de Manutenção

*(Histórico cronológico vive em `progress.md`. Resumo em `task_plan.md`.)*
- **2026-05-29** — Projeto inicializado. Estrutura de pastas e documentos de IA criados (Protocolo 0).
