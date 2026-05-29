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
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)

  useEffect(() => {
    ensureFontsLoaded()
  }, [])

  // Atalhos: Delete remove o selecionado; Ctrl+Z desfaz; Ctrl+Y / Ctrl+Shift+Z refaz.
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target.tagName
      const typing = t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT'
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        redo()
        return
      }
      if (!typing && selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        removeElement(selectedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, removeElement, undo, redo])

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
