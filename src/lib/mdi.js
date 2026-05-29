// Resolve nomes de ícones (padrão Material Design Icons, kebab-case) para o path
// SVG, carregando @mdi/js sob demanda. Usado na geração por IA: a IA escreve
// nomes como "rocket-launch" e aqui buscamos o desenho real entre os ~7.400.
let cache = null

async function load() {
  if (!cache) cache = await import('@mdi/js')
  return cache
}

// "rocket-launch" | "rocket launch" | "rocketLaunch" -> "mdiRocketLaunch"
function toKey(name) {
  const parts = String(name)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
  return 'mdi' + parts.map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join('')
}

export async function resolveIconPaths(names) {
  const unique = [...new Set((names || []).filter(Boolean))]
  if (!unique.length) return {}
  const mod = await load()
  const map = {}
  for (const n of unique) {
    const key = toKey(n)
    if (typeof mod[key] === 'string') map[n] = mod[key]
  }
  return map
}
