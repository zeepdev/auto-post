// Salvar/abrir o projeto como arquivo .atp (JSON). Permite guardar um post/carrossel
// e reabrir depois pra continuar editando.
const APP = 'auto-post'
const VERSION = 1

export function saveProject(name, project) {
  const data = { app: APP, version: VERSION, format: project.format, slides: project.slides }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(name || 'meu-post').replace(/[^\w\-]+/g, '-')}.atp`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function readProjectFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        const d = JSON.parse(r.result)
        if (!d || !Array.isArray(d.slides) || !d.slides.length) {
          throw new Error('formato')
        }
        resolve(d)
      } catch {
        reject(new Error('Arquivo .atp inválido ou corrompido.'))
      }
    }
    r.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    r.readAsText(file)
  })
}
