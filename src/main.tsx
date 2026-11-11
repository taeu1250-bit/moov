import { createRoot } from 'react-dom/client'
import { App } from './App'
import { makeLocalServices } from './data/local'
import './styles.css'

createRoot(document.getElementById('root')!).render(<App services={makeLocalServices()} />)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .catch(() => console.warn('오프라인 기능을 등록하지 못했어요.'))
  })
}
