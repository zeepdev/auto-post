# 📋 Task Plan — auto-post

> Fases, objetivos e checklists. Regido pelo [Protocolo V.L.A.E.G.](protocolo_vlaeg.md).

---

## ✅ Fase 0 — Inicialização (Protocolo 0)
- [x] Criar pasta do projeto `auto-post/`
- [x] Copiar `protocolo_vlaeg.md`
- [x] Criar memória do projeto (`task_plan.md`, `findings.md`, `progress.md`)
- [x] Criar constituição `gemini.md`
- [x] Criar estrutura de pastas (`architecture/`, `tools/`)
- [ ] **BLOQUEIO:** Responder a Descoberta abaixo antes de codar

---

## ✅ Fase V — Visão (Descoberta)
Respondida via `/goal` em 2026-05-29. Resultado: gerador web de posts/carrosséis pro Instagram, guiado por referências visuais.
- [x] Definir Data Schema (entrada/saída) em `gemini.md`
- [x] Blueprint da arquitetura aprovado (client-side, sem backend)

---

## ✅ Fase L — Link (Conectividade)
- [x] Sem serviços externos/chaves no MVP — análise de referência roda client-side. `.env` não necessário.

---

## ✅ Fase A — Arquitetura (MVP construído)
- [x] Store zustand + persistência localStorage
- [x] Libs: colors (paleta), stage, exporter, templates, fonts
- [x] Componentes: Header, LeftPanel, CanvasStage, RightPanel, SlideStrip
- [x] `npm install` + `npm run build` + `npm run dev` validados

---

## ✅ Fase A.2 — IA + Logo + Pacotes (2026-05-29)
- [x] IA generativa: Claude API no navegador (`lib/ai.js`) + motor de layout (`lib/layoutEngine.js`)
- [x] Aba "IA / Contexto": briefing + foto/documento, post/carrossel, escolha de logo
- [x] Logo & Identidade: extrai cores do logo, sugere identidade, insere logo na arte
- [x] Pacotes de referência: criar/nomear/salvar coleções de imagens reutilizáveis
- [x] Build OK (244 módulos)

---

## ✨ Fase E — Estilo (parcial)
- [x] UI dark moderna, 3 painéis, responsivo, abas Design/IA
- [x] Export em alta (1080px), PNG/JPG
- [ ] (futuro) Edição de texto inline no canvas
- [ ] (futuro) Suporte a PDF como documento de contexto
- [ ] (futuro) Export em ZIP único; biblioteca de ícones
- [ ] (futuro) Backend pra esconder a chave de API se publicar pra terceiros
- [ ] Validar visualmente com o dono e ajustar

---

## 🛰️ Fase G — Gatilho (Deploy)
- [ ] `npm run build` → publicar `dist/` na Vercel/Netlify
- [ ] (opcional) domínio próprio
- App é estático e roda sozinho no navegador — não precisa cron/webhook.
