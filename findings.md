# 🔎 Findings — auto-post

> Pesquisas, descobertas, restrições e decisões técnicas. Atualizar após cada tarefa significativa.

---

## Descobertas
_(vazio — preencher após a fase de Descoberta e pesquisa de recursos)_

## Restrições / Limites de API
_(ex: rate limits, formatos aceitos, autenticação — registrar aqui ao descobrir)_

## Decisões técnicas
- **App client-side puro** (sem backend) no MVP. Análise de referência = extração de paleta por sampling de pixels.
- **IA generativa via Claude API direto do navegador** (decidido com o dono em 2026-05-29). Chave Anthropic no `localStorage`. Header obrigatório `anthropic-dangerous-direct-browser-access: true` pra CORS. Modelo `claude-sonnet-4-6` (visão + custo). Saída forçada via **tool use** (`create_post`) → JSON estruturado.
- **Divisão de responsabilidade IA vs layout:** a IA devolve só o *conteúdo* (kind/title/body/bullets/identity). O `layoutEngine` posiciona deterministicamente. Evita coordenadas erradas vindas do LLM e mantém o princípio VLAEG (lógica determinística).
- **Logo → identidade:** `extractPalette` no logo + `buildIdentity()` (fundo = cor mais escura, accent = mais clara/viva, texto = legível por luminância).
- **Persistência:** projeto em `auto-post:project:v1`; logos em `auto-post:logos:v1`; pacotes em `auto-post:packages:v1`; chave em `auto-post:anthropic-key`.

## ✅ Segurança (resolvido em 2026-05-29)
A chave **não fica mais no navegador**. Backend serverless na Vercel (`api/`) guarda `ANTHROPIC_API_KEY` em env var e faz o proxy da Claude. Acesso ao site protegido por login (usuário/senha em `AUTH_USERS`, sem banco; sessão = token HMAC assinado com `AUTH_SECRET`, TTL 12h). `/api/generate` exige `Authorization: Bearer`.
- **Atenção:** `AUTH_SECRET` precisa ser longo e aleatório em produção (senão dá pra forjar token). `.env` é gitignored; configurar as vars na Vercel.
- Limite de payload serverless (~4.5MB): imagens de contexto são reduzidas com `downscaleDataURL` (máx 1024px, JPEG) antes do envio.

## Loop de Reparo (erros resolvidos)
_(quando uma ferramenta falha e é corrigida, registrar o aprendizado aqui e no POP de `architecture/`)_
