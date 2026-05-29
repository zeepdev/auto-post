// Chamada à Claude API no SERVIDOR. A chave (ANTHROPIC_API_KEY) nunca vai pro
// navegador. Recebe o contexto e devolve, via tool use, o spec de conteúdo.

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

// Mantenha em sincronia com src/lib/icons.js (ICON_LIST).
const ICON_NAMES = [
  'estrela', 'coracao', 'raio', 'seta', 'escudo', 'diamante',
  'mais', 'check', 'brilho', 'pino', 'fogo', 'pilar', 'engrenagem',
  'casa', 'telefone', 'balao', 'grafico', 'lampada', 'play',
  'coroa', 'aspas', 'foguete', 'selo',
]

const POST_TOOL = {
  name: 'create_post',
  description: 'Monta o conteúdo de um post ou carrossel para Instagram a partir do contexto.',
  input_schema: {
    type: 'object',
    properties: {
      identity: {
        type: 'object',
        description: 'Cores em hex (#RRGGBB) para a identidade visual.',
        properties: {
          background: { type: 'string' },
          textColor: { type: 'string' },
          accent: { type: 'string' },
        },
        required: ['background', 'textColor', 'accent'],
      },
      slides: {
        type: 'array',
        description: 'Slides na ordem. Primeiro = capa; último = CTA quando carrossel.',
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['cover', 'content', 'cta'] },
            title: { type: 'string' },
            subtitle: { type: 'string' },
            body: { type: 'string' },
            bullets: { type: 'array', items: { type: 'string' } },
            footer: { type: 'string' },
            decorations: {
              type: 'array',
              description:
                'Elementos visuais decorativos pra enriquecer a arte (ficam atrás do texto). Use com moderação (0 a 4 por slide).',
              items: {
                type: 'object',
                properties: {
                  shape: { type: 'string', enum: ['circle', 'triangle', 'square', 'icon'] },
                  icon: {
                    type: 'string',
                    enum: ICON_NAMES,
                    description: 'Obrigatório quando shape = "icon".',
                  },
                  x: { type: 'number', description: 'Centro X relativo, 0 a 1.' },
                  y: { type: 'number', description: 'Centro Y relativo, 0 a 1.' },
                  size: { type: 'number', description: 'Tamanho relativo à largura, 0 a 1.' },
                  color: { type: 'string', description: 'Cor hex.' },
                  opacity: { type: 'number', description: '0 a 1.' },
                  rotation: { type: 'number' },
                },
                required: ['shape'],
              },
            },
          },
          required: ['kind', 'title'],
        },
      },
    },
    required: ['slides'],
  },
}

function dataURLtoSource(dataURL) {
  const m = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(dataURL || '')
  return m ? { type: 'base64', media_type: m[1], data: m[2] } : null
}

export async function generateSpec({ contextText, images = [], mode, pages, palette = [] }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada no servidor.')

  const count = mode === 'carousel' ? Math.max(2, Math.min(pages || 5, 10)) : 1

  const system = [
    'Você é um diretor de arte e copywriter sênior de social media, especialista em Instagram.',
    'Escreva sempre em português do Brasil, com linguagem clara, persuasiva e adequada ao público.',
    'Títulos curtos e impactantes; textos escaneáveis; nada de clichê vazio.',
    'SEMPRE enriqueça a arte com "decorations" (formas geométricas ou ícones da lista). Em todo slide use: (1) UMA decoração grande e bem esmaecida (size 0.6–0.9, opacity 0.08–0.15, ex: pilar/engrenagem/diamante/escudo) como elemento de fundo pra dar profundidade, e (2) de 1 a 3 detalhes pequenos nos cantos/bordas (ex: aspas, brilho, raio, pontos). Nunca cubra o texto — decorações ficam atrás dele.',
    'Combine as cores das decorações com a identity (accent e variações), variando opacidade pra dar camadas.',
    'Use a ferramenta create_post para devolver o conteúdo estruturado.',
    palette.length
      ? `Paleta de marca sugerida (use em identity, com cores legíveis): ${palette.join(', ')}.`
      : 'Defina em identity cores coerentes com o contexto (fundo, texto legível e destaque).',
  ].join(' ')

  const instruction =
    mode === 'carousel'
      ? `Monte um CARROSSEL com exatamente ${count} slides: 1º kind "cover", os do meio kind "content" (use bullets quando fizer sentido) e o último kind "cta".`
      : 'Monte um POST ÚNICO: um slide kind "cover" com title e subtitle.'

  const content = []
  if (contextText && contextText.trim())
    content.push({ type: 'text', text: `CONTEXTO:\n${contextText.trim()}` })
  for (const img of images.slice(0, 8)) {
    const source = dataURLtoSource(img)
    if (source) content.push({ type: 'image', source })
  }
  content.push({ type: 'text', text: `${instruction}\nGere agora usando a ferramenta create_post.` })

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system,
      tools: [POST_TOOL],
      tool_choice: { type: 'tool', name: 'create_post' },
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const e = await res.json()
      detail = e?.error?.message || JSON.stringify(e)
    } catch {
      detail = await res.text()
    }
    throw new Error(`Claude API (${res.status}): ${detail}`)
  }

  const data = await res.json()
  const toolUse = (data.content || []).find((c) => c.type === 'tool_use')
  if (!toolUse) throw new Error('A IA não retornou um resultado estruturado.')
  return toolUse.input
}
