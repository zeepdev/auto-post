# auto-post · Gerador de Posts & Carrosséis para Instagram

Web app que cria **posts e carrosséis** prontos pra baixar, guiado por **referências visuais**. Roda 100% no navegador (sem backend).

## Rodar localmente
```bash
npm install
cp .env.example .env   # edite com sua chave Anthropic, usuários e segredo
npm run dev            # sobe o site (5174) + a API (3000) juntos
```
Acesse http://localhost:5174 e faça login com um usuário do `AUTH_USERS`.

## Deploy na Vercel
1. Suba o repositório e importe o projeto na Vercel (framework Vite é detectado).
2. Em **Settings → Environment Variables**, configure as mesmas do `.env.example`:
   - `ANTHROPIC_API_KEY` (sua chave — fica só no servidor)
   - `AUTH_USERS` (ex: `admin:senhaforte,cliente:outrasenha`)
   - `AUTH_SECRET` (string aleatória longa)
3. Deploy. As funções em `api/` viram serverless automaticamente; o site sai estático.

> 🔒 A chave da Anthropic **nunca** vai pro navegador — toda chamada de IA passa pelo backend, que exige login. O acesso ao site é protegido por usuário/senha (sem banco de dados).

## O que dá pra fazer
- **Formatos:** Feed 1080×1350 e Story/Reel 1080×1920.
- **Referências:** suba prints/posts → o app extrai a **paleta de cores** dominante; clique numa cor pra aplicar no fundo.
- **Canvas interativo** (react-konva): arraste, redimensione e gire textos, formas e imagens. Preview em tempo real.
- **Texto:** 8 fontes (Inter, Poppins, Montserrat, Playfair, Oswald, Bebas Neue, Lora, Roboto), tamanho, cor, alinhamento, espaçamento, entrelinha.
- **Templates** prontos: Capa Bold, Citação, Dica/Lista, Minimal (adaptam à paleta e ao formato).
- **Carrossel:** vários slides com miniaturas, adicionar/duplicar/excluir.
- **Download:** PNG ou JPG em **alta (1080px)**. Carrossel baixa todos os slides em sequência (`auto-post-1.png`, `-2`, ...).
- Projeto salvo automaticamente no `localStorage` do navegador.

### 🪄 IA / Contexto (aba IA)
- Não precisa colar chave nenhuma — a IA roda no backend (chave fica no servidor).
- Dê um **contexto**: briefing em texto + anexe **fotos** (a IA enxerga) e/ou **documentos** (.txt/.md/.csv).
- Escolha **post único ou carrossel** (e nº de páginas) e qual **logo** entra na arte.
- A Claude lê tudo e monta o conteúdo; o app posiciona e insere o logo automaticamente.

### 🎨 Logo & Identidade (aba Design)
- Suba seu logo → o app lê as cores e sugere uma **identidade** (fundo/texto/destaque). Clique "Usar identidade" pra aplicar, ou "Inserir na arte" pra colocar o logo no slide.

### 📦 Pacotes de referência (aba Design)
- Junte várias imagens num **pacote nomeado** (ex: "Pacote 1"), salve e reutilize: aplica a paleta no design ou serve de referência visual pra IA na aba Contexto.

## Atalhos
- `Delete` / `Backspace`: exclui o elemento selecionado.
- Clique no fundo: desseleciona.

## Stack
Frontend: React 18 · Vite · react-konva/konva · zustand.
Backend: funções serverless Node em `api/` (login + proxy da Claude). Auth por token HMAC, sem banco.

## Arquitetura / continuidade
Projeto segue o **Protocolo V.L.A.E.G.** — ver `protocolo_vlaeg.md` e `gemini.md` (constituição).
Documentos de IA: `gemini.md`, `task_plan.md`, `findings.md`, `progress.md`.
