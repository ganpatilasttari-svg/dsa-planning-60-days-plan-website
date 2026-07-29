import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Code as Code2, Eye, CircleAlert as AlertCircle, ChartBar as BarChart3, LayoutDashboard, Target, BookOpen, Flame, Clock, Sun, Moon } from 'lucide-react'
import { getTodayDayNumber } from '../data/schedule'
import NotificationManager from './NotificationManager'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function useISTClock() {
  const [state, setState] = useState({ time: '', isDay: true })
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const istOffset = 5.5 * 60 * 60 * 1000
      const ist = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000))
      const h = ist.getUTCHours()
      const m = ist.getUTCMinutes().toString().padStart(2, '0')
      const s = ist.getUTCSeconds().toString().padStart(2, '0')
      const period = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 === 0 ? 12 : h % 12
      setState({ time: `${h12}:${m}:${s} ${period} IST`, isDay: h >= 6 && h < 18 })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])
  return state
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const todayDay = getTodayDayNumber()
  const [solvedCount, setSolvedCount] = useState(0)

  useEffect(() => {
    NotificationManager.init()
    loadProgress()
  }, [])

  const loadProgress = async () => {
    const { data } = await supabase.from('problem_attempts').select('*').eq('status', 'solved')
    setSolvedCount(data?.length || 0)
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'var(--cyan-bright)' },
    { path: '/overview', label: '55-Day Plan', icon: Target, color: 'var(--green-bright)' },
    { path: `/day/${todayDay}`, label: `Today (Day ${todayDay})`, icon: Calendar, color: 'var(--blue-bright)' },
    { path: '/focus', label: 'Focus Tracker', icon: Eye, color: 'var(--amber-bright)' },
    { path: '/weak-topics', label: 'Weak Topics', icon: AlertCircle, color: 'var(--pink-bright)' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, color: 'var(--teal-bright)' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (path.startsWith('/day/')) return location.pathname.startsWith('/day/')
    return location.pathname.startsWith(path)
  }

  const progressPercent = Math.round((solvedCount / 275) * 100)
  const { time: istTime, isDay } = useISTClock()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Code2 size={20} color="white" />
            </div>
            <div className="sidebar-logo-text">
              <span className="main">SDE Prep</span>
              <span className="sub">55-Day Tracker</span>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Navigation</div>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  style={isActive(item.path) ? ({ ['--item-color' as any]: item.color, borderColor: `${item.color}40`, color: item.color, boxShadow: `inset 4px 0 0 ${item.color}, 0 0 20px ${item.color}30` } as any) : undefined}
                >
                  <Icon size={16} style={{ color: isActive(item.path) ? item.color : undefined, filter: isActive(item.path) ? `drop-shadow(0 0 8px ${item.color})` : undefined }} />
                  {item.label}
                </div>
              )
            })}
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Quick Access</div>
            <div className="nav-item" onClick={() => navigate(`/day/${todayDay}/editor/d${todayDay}q1`)}>
              <Code2 size={16} />
              Code Editor
            </div>
            <div className="nav-item" onClick={() => navigate('/overview')}>
              <BookOpen size={16} />
              All Topics
            </div>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', justifyContent: 'center', padding: '6px 10px', borderRadius: '20px', background: isDay ? 'rgba(255,184,0,0.1)' : 'rgba(91,77,255,0.1)', border: `1px solid ${isDay ? 'rgba(255,184,0,0.3)' : 'rgba(91,77,255,0.3)'}` }}>
            {isDay ? <Sun size={12} color="var(--amber-bright)" /> : <Moon size={12} color="var(--indigo-bright)" />}
            <span style={{ fontSize: '11px', fontWeight: 700, color: isDay ? 'var(--amber-bright)' : 'var(--indigo-bright)', fontFamily: 'var(--font-mono)' }}>{istTime}</span>
          </div>
          <div className="sidebar-progress-ring">
            <div className="progress-ring-circle" style={{ ['--p' as any]: `${progressPercent}%` }}>
              <div className="progress-ring-inner">{progressPercent}%</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{solvedCount} solved</div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Day {todayDay} of 55</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
