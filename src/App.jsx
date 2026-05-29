import { useEffect } from 'react'
import { useStore } from './store.js'
import { ensureFontsLoaded } from './lib/fonts.js'
import Header from './components/Header.jsx'
import LeftPanel from './components/LeftPanel.jsx'
import CanvasStage from './components/CanvasStage.jsx'
import RightPanel from './components/RightPanel.jsx'
import SlideStrip from './components/SlideStrip.jsx'
import Login from './components/Login.jsx'

export default function App() {
  const token = useStore((s) => s.token)
  const selectedId = useStore((s) => s.selectedId)
  const removeElement = useStore((s) => s.removeElement)

  useEffect(() => {
    ensureFontsLoaded()
  }, [])

  // Delete/Backspace remove o elemento selecionado (exceto digitando em campos).
  useEffect(() => {
    const onKey = (e) => {
      if (!selectedId) return
      const t = e.target.tagName
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeElement(selectedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, removeElement])

  if (!token) return <Login />

  return (
    <div className="app">
      <Header />
      <main className="workspace">
        <LeftPanel />
        <section className="stage-col">
          <CanvasStage />
          <SlideStrip />
        </section>
        <RightPanel />
      </main>
    </div>
  )
}
