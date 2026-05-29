// Catálogo de fontes carregadas no index.html (Google Fonts).
export const FONTS = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Playfair Display',
  'Oswald',
  'Bebas Neue',
  'Lora',
  'Roboto',
]

// Aguarda as fontes ficarem prontas para o canvas medir/renderizar corretamente.
export async function ensureFontsLoaded() {
  if (!document.fonts) return
  try {
    await Promise.all(
      FONTS.flatMap((f) => [
        document.fonts.load(`400 16px "${f}"`),
        document.fonts.load(`700 16px "${f}"`),
        document.fonts.load(`900 16px "${f}"`),
      ])
    )
    await document.fonts.ready
  } catch {
    /* fontes carregam de forma assíncrona; o canvas re-renderiza quando prontas */
  }
}
