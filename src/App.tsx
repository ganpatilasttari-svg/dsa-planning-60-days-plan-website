import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DaySchedule from './pages/DaySchedule'
import CodeEditor from './pages/CodeEditor'
import FocusTracker from './pages/FocusTracker'
import WeakTopics from './pages/WeakTopics'
import Analytics from './pages/Analytics'
import Overview from './pages/Overview'
import { CameraProvider } from './components/CameraContext'
import FloatingCamera from './components/FloatingCamera'

function useDayNightMode() {
  const [mode, setMode] = useState<'day' | 'night'>('night')
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const istOffset = 5.5 * 60 * 60 * 1000
      const ist = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000))
      const h = ist.getUTCHours()
      setMode(h >= 6 && h < 18 ? 'day' : 'night')
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    document.body.classList.remove('day-mode', 'night-mode')
    document.body.classList.add(mode === 'day' ? 'day-mode' : 'night-mode')
  }, [mode])
}

export default function App() {
  useDayNightMode()
  return (
    <CameraProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/day/:dayNumber" element={<DaySchedule />} />
          <Route path="/day/:dayNumber/editor/:questionId" element={<CodeEditor />} />
          <Route path="/focus" element={<FocusTracker />} />
          <Route path="/weak-topics" element={<WeakTopics />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <FloatingCamera />
    </CameraProvider>
  )
}
