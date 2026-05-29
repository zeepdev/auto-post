import { create } from 'zustand'
import { getStageSize } from './lib/stage.js'
import { luminance, readableTextColor } from './lib/colors.js'
import { getToken, getUsername, saveSession, clearSession } from './lib/api.js'

// Deriva uma identidade visual {background, textColor, accent} a partir de uma paleta.
// background = cor mais escura (boa pra fundo), accent = cor mais viva e distinta.
export function buildIdentity(palette) {
  if (!palette || !palette.length) {
    return { background: '#0E1116', textColor: '#FFFFFF', accent: '#6C5CE7' }
  }
  const sorted = [...palette].sort((a, b) => luminance(a) - luminance(b))
  const background = sorted[0]
  const accent = sorted[sorted.length - 1] === background ? '#6C5CE7' : sorted[sorted.length - 1]
  return { background, textColor: readableTextColor(background), accent }
}

// id curto sem dependência externa
export const nanoid = () => Math.random().toString(36).slice(2, 10)

export const FORMATS = {
  feed: { key: 'feed', label: 'Feed 1080×1350', w: 1080, h: 1350 },
  story: { key: 'story', label: 'Story 1080×1920', w: 1080, h: 1920 },
}

const STORAGE_KEY = 'auto-post:project:v1'
const LOGOS_KEY = 'auto-post:logos:v1'
const PKGS_KEY = 'auto-post:packages:v1'

function loadJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function saveJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* storage cheio/indisponível */
  }
}

function blankSlide(background = '#0E1116') {
  return { id: nanoid(), background, elements: [] }
}

function initialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p.slides?.length) return p
    }
  } catch {
    /* ignora projeto corrompido */
  }
  return {
    format: FORMATS.feed,
    slides: [blankSlide()],
    currentIndex: 0,
  }
}

function persist(get) {
  const { format, slides, currentIndex } = get()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ format, slides, currentIndex }))
  } catch {
    /* localStorage cheio/indisponível — segue sem persistir */
  }
}

export const useStore = create((set, get) => {
  const update = (fn) => {
    set(fn)
    persist(get)
  }

  // aplica um patch ao slide atual
  const patchCurrentSlide = (patch) =>
    update((s) => ({
      slides: s.slides.map((sl, i) =>
        i === s.currentIndex ? { ...sl, ...patch } : sl
      ),
    }))

  return {
    ...initialState(),
    selectedId: null,
    palette: [],
    references: [],
    logos: loadJSON(LOGOS_KEY),
    packages: loadJSON(PKGS_KEY),
    identity: null,
    token: getToken(),
    username: getUsername(),

    // ---- formato ----
    setFormat: (key) => update(() => ({ format: FORMATS[key], selectedId: null })),

    // ---- slides ----
    addSlide: () =>
      update((s) => {
        const slides = [...s.slides, blankSlide(s.slides[s.currentIndex]?.background)]
        return { slides, currentIndex: slides.length - 1, selectedId: null }
      }),
    duplicateSlide: () =>
      update((s) => {
        const cur = s.slides[s.currentIndex]
        const copy = {
          id: nanoid(),
          background: cur.background,
          elements: cur.elements.map((e) => ({ ...e, id: nanoid() })),
        }
        const slides = [...s.slides]
        slides.splice(s.currentIndex + 1, 0, copy)
        return { slides, currentIndex: s.currentIndex + 1, selectedId: null }
      }),
    removeSlide: (index) =>
      update((s) => {
        if (s.slides.length <= 1) return {}
        const slides = s.slides.filter((_, i) => i !== index)
        const currentIndex = Math.max(0, Math.min(s.currentIndex, slides.length - 1))
        return { slides, currentIndex, selectedId: null }
      }),
    setCurrent: (index) => update(() => ({ currentIndex: index, selectedId: null })),

    setBackground: (color) => patchCurrentSlide({ background: color }),

    // ---- elementos ----
    addText: () =>
      update((s) => {
        const { w, h } = getStageSize(s.format)
        const el = {
          id: nanoid(),
          type: 'text',
          x: w * 0.1,
          y: h * 0.42,
          width: w * 0.8,
          text: 'Toque para editar',
          fontFamily: 'Inter',
          fontSize: Math.round(h * 0.05),
          fontStyle: 'bold',
          fill: '#FFFFFF',
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 0,
          rotation: 0,
          opacity: 1,
        }
        return addElToCurrent(s, el)
      }),
    addRect: () =>
      update((s) => {
        const { w, h } = getStageSize(s.format)
        const el = {
          id: nanoid(),
          type: 'rect',
          x: w * 0.3,
          y: h * 0.4,
          width: w * 0.4,
          height: h * 0.12,
          fill: '#6C5CE7',
          cornerRadius: 8,
          rotation: 0,
          opacity: 1,
        }
        return addElToCurrent(s, el)
      }),
    addImage: (src, naturalW, naturalH) =>
      update((s) => {
        const { w } = getStageSize(s.format)
        const targetW = w * 0.6
        const ratio = naturalH / naturalW
        const el = {
          id: nanoid(),
          type: 'image',
          src,
          x: w * 0.2,
          y: w * 0.2,
          width: targetW,
          height: targetW * ratio,
          cornerRadius: 0,
          rotation: 0,
          opacity: 1,
        }
        return addElToCurrent(s, el)
      }),

    updateElement: (id, patch) =>
      update((s) => ({
        slides: s.slides.map((sl, i) =>
          i === s.currentIndex
            ? { ...sl, elements: sl.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) }
            : sl
        ),
      })),
    removeElement: (id) =>
      update((s) => ({
        selectedId: s.selectedId === id ? null : s.selectedId,
        slides: s.slides.map((sl, i) =>
          i === s.currentIndex
            ? { ...sl, elements: sl.elements.filter((e) => e.id !== id) }
            : sl
        ),
      })),
    moveElement: (id, dir) =>
      update((s) => ({
        slides: s.slides.map((sl, i) => {
          if (i !== s.currentIndex) return sl
          const idx = sl.elements.findIndex((e) => e.id === id)
          const to = idx + dir
          if (idx < 0 || to < 0 || to >= sl.elements.length) return sl
          const els = [...sl.elements]
          const [m] = els.splice(idx, 1)
          els.splice(to, 0, m)
          return { ...sl, elements: els }
        }),
      })),

    select: (id) => set({ selectedId: id }),

    // ---- referências / paleta ----
    addReference: (src) => set((s) => ({ references: [src, ...s.references].slice(0, 8) })),
    setPalette: (palette) => set({ palette }),

    // ---- templates ----
    applyTemplate: (built) => patchCurrentSlide(built),

    // ---- logos & identidade ----
    addLogo: (logo) =>
      set((s) => {
        const logos = [{ id: nanoid(), ...logo }, ...s.logos].slice(0, 6)
        saveJSON(LOGOS_KEY, logos)
        return { logos }
      }),
    removeLogo: (id) =>
      set((s) => {
        const logos = s.logos.filter((l) => l.id !== id)
        saveJSON(LOGOS_KEY, logos)
        return { logos }
      }),

    // ---- pacotes de referência (coleções nomeadas de imagens + paleta) ----
    addPackage: (pkg) =>
      set((s) => {
        const packages = [{ id: nanoid(), ...pkg }, ...s.packages].slice(0, 12)
        saveJSON(PKGS_KEY, packages)
        return { packages }
      }),
    removePackage: (id) =>
      set((s) => {
        const packages = s.packages.filter((p) => p.id !== id)
        saveJSON(PKGS_KEY, packages)
        return { packages }
      }),
    applyPackagePalette: (pkg) =>
      update((s) => {
        const pal = pkg.palette || []
        return { palette: pal.length ? pal : s.palette }
      }),
    // Aplica a identidade visual de um logo: paleta + cores + fundo do slide atual.
    applyIdentity: (logo) =>
      update((s) => {
        const pal = logo.palette || []
        const identity = buildIdentity(pal)
        return {
          palette: pal.length ? pal : s.palette,
          identity,
          slides: s.slides.map((sl, i) =>
            i === s.currentIndex ? { ...sl, background: identity.background } : sl
          ),
        }
      }),
    setIdentity: (identity) => set({ identity }),

    // insere um logo como elemento de imagem no slide atual
    insertLogo: (logo) =>
      update((s) => {
        const { w, h } = getStageSize(s.format)
        const targetW = w * 0.22
        const ratio = logo.naturalH / logo.naturalW || 1
        const el = {
          id: nanoid(),
          type: 'image',
          src: logo.src,
          x: w * 0.5 - targetW / 2,
          y: h * 0.86,
          width: targetW,
          height: targetW * ratio,
          cornerRadius: 0,
          rotation: 0,
          opacity: 1,
        }
        return addElToCurrent(s, el)
      }),

    // ---- sessão / auth ----
    setSession: (token, username) => {
      saveSession(token, username)
      set({ token, username })
    },
    logout: () => {
      clearSession()
      set({ token: '', username: '' })
    },
    // Substitui o projeto pelos slides gerados pela IA.
    applyGenerated: (slides, identity) =>
      update(() => ({
        slides: slides.length ? slides : [blankSlide()],
        currentIndex: 0,
        selectedId: null,
        identity: identity || null,
      })),

    reset: () =>
      update(() => ({
        format: FORMATS.feed,
        slides: [blankSlide()],
        currentIndex: 0,
        selectedId: null,
      })),
  }
})

function addElToCurrent(s, el) {
  return {
    selectedId: el.id,
    slides: s.slides.map((sl, i) =>
      i === s.currentIndex ? { ...sl, elements: [...sl.elements, el] } : sl
    ),
  }
}
