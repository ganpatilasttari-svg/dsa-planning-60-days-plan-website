import { useEffect, useState } from 'react'
import { TrendingUp, Clock, CircleCheck as CheckCircle, Target, Award, ChartBar as BarChart3, Brain } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDuration, getTodayDayNumber, PHASES, getAllDays, getTopicTypeBadge } from '../data/schedule'
import type { ProblemAttempt, FocusLog, StudySession } from '../types'
import NotificationToast from '../components/NotificationToast'
import DayNightIcon from '../components/DayNightIcon'

export default function Analytics() {
  const [attempts, setAttempts] = useState<ProblemAttempt[]>([])
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([])
  const todayDay = getTodayDayNumber()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: a } = await supabase.from('problem_attempts').select('*'); setAttempts(a || [])
    const { data: f } = await supabase.from('focus_logs').select('*'); setFocusLogs(f || [])
  }

  const solved = attempts.filter(a => a.status === 'solved')
  const attempted = attempts.filter(a => a.status === 'attempted')
  const avgAccuracy = solved.length > 0 ? Math.round(solved.reduce((s, a) => s + (a.accuracy || 0), 0) / solved.length) : 0
  const totalFocusSeconds = focusLogs.reduce((s, f) => s + (f.focused_seconds || 0), 0)
  const avgFocusScore = focusLogs.length > 0 ? Math.round(focusLogs.reduce((s, f) => s + (f.focus_score || 0), 0) / focusLogs.length) : 0

  const easySolved = solved.filter(a => a.difficulty === 'Easy').length
  const mediumSolved = solved.filter(a => a.difficulty === 'Medium').length
  const hardSolved = solved.filter(a => a.difficulty === 'Hard').length

  const topicStats: Record<string, { solved: number; attempted: number; total: number; type: string }> = {}
  getAllDays().forEach(day => day.questions.forEach(q => {
    if (!topicStats[q.topic]) topicStats[q.topic] = { solved: 0, attempted: 0, total: 0, type: q.topicType }
    topicStats[q.topic].total++
  }))
  attempts.forEach(a => {
    if (!topicStats[a.problem_topic]) topicStats[a.problem_topic] = { solved: 0, attempted: 0, total: 0, type: 'DSA' }
    if (a.status === 'solved') topicStats[a.problem_topic].solved++
    if (a.status === 'attempted') topicStats[a.problem_topic].attempted++
  })

  const focusByDay: Record<number, number> = {}
  focusLogs.forEach(f => { focusByDay[f.day_number] = (focusByDay[f.day_number] || 0) + (f.focused_seconds || 0) })

  const sortedTopics = Object.entries(topicStats).sort((a, b) => b[1].total - a[1].total)
  const allDays = getAllDays()

  return (
    <>
      <NotificationToast />
      <div className="topbar">
        <div className="topbar-title">Analytics</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="day-pill"><BarChart3 size={14} /> Day {todayDay} of 55</div>
          <DayNightIcon />
        </div>
      </div>

      <div className="content-area">
        <div className="stat-grid">
          <div className="stat-card green animate-fadeIn">
            <div className="stat-label"><CheckCircle size={14} /> Total Solved</div>
            <div className="stat-value">{solved.length}</div>
            <div className="stat-sub">{attempted.length} in progress</div>
          </div>
          <div className="stat-card blue animate-fadeIn">
            <div className="stat-label"><Clock size={14} /> Total Focus Time</div>
            <div className="stat-value">{formatDuration(totalFocusSeconds)}</div>
            <div className="stat-sub">Across {focusLogs.length} sessions</div>
          </div>
          <div className="stat-card amber animate-fadeIn">
            <div className="stat-label"><TrendingUp size={14} /> Avg Accuracy</div>
            <div className="stat-value">{avgAccuracy}%</div>
            <div className="stat-sub">On solved problems</div>
          </div>
          <div className="stat-card pink animate-fadeIn">
            <div className="stat-label"><Target size={14} /> Avg Focus Score</div>
            <div className="stat-value">{avgFocusScore}%</div>
            <div className="stat-sub">Camera-based tracking</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card animate-fadeIn">
            <div className="section-title"><Award size={18} style={{ color: '#a0a0a0' }} /> Problems by Difficulty</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Easy', count: easySolved, color: '#e8e8e8', badge: 'badge-easy' },
                { label: 'Medium', count: mediumSolved, color: '#a0a0a0', badge: 'badge-medium' },
                { label: 'Hard', count: hardSolved, color: '#808080', badge: 'badge-hard' },
              ].map(d => (
                <div key={d.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className={`badge ${d.badge}`}>{d.label}</span>
                    <span className="font-mono font-900">{d.count} solved</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${Math.min(100, (d.count / Math.max(1, solved.length)) * 100)}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card animate-fadeIn">
            <div className="section-title"><Clock size={18} style={{ color: '#ffffff' }} /> Focus Time by Day</div>
            {Object.keys(focusByDay).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(focusByDay).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([day, sec]) => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '60px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Day {day}</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-bar-fill" style={{ width: `${Math.min(100, (sec / 3600) * 100)}%`, background: '#ffffff' }} />
                    </div>
                    <span style={{ width: '60px', fontSize: '12px', fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 700 }}>{formatDuration(sec)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><Clock size={32} className="empty-state-icon" /><div className="empty-state-text">No focus data yet</div></div>
            )}
          </div>
        </div>

        <div className="card animate-fadeIn mt-4">
          <div className="section-title"><Target size={18} style={{ color: '#c0c0c0' }} /> Topic-wise Progress</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {sortedTopics.map(([topic, stats]) => (
              <div key={topic} className="card" style={{ background: 'var(--bg-tertiary)', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="font-700">{topic}</div>
                  <span className={`badge ${getTopicTypeBadge(stats.type)}`}>{stats.type}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  <span>Solved: {stats.solved}</span><span>Total: {stats.total}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${stats.total > 0 ? (stats.solved / stats.total) * 100 : 0}%`, background: stats.solved === stats.total && stats.total > 0 ? '#e8e8e8' : '#ffffff' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card animate-fadeIn mt-4">
          <div className="section-title"><TrendingUp size={18} style={{ color: '#c0c0c0' }} /> Phase Progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PHASES.map(phase => {
              const phaseDays = allDays.filter(d => d.phase === phase.number)
              const phaseSolved = attempts.filter(a => { const day = allDays.find(d => d.dayNumber === a.day_number); return day?.phase === phase.number && a.status === 'solved' }).length
              const phaseTotal = phaseDays.reduce((s, d) => s + d.questions.length, 0)
              const isCurrent = phase.number === allDays.find(d => d.dayNumber === todayDay)?.phase
              return (
                <div key={phase.number} className="card" style={{ background: isCurrent ? 'var(--bg-elevated)' : 'var(--bg-tertiary)', padding: '14px', borderColor: isCurrent ? phase.color : 'var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--r-sm)', background: phase.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: 'white' }}>{phase.number}</div>
                    <div className="flex-1">
                      <div className="font-700">{phase.name}</div>
                      <div className="text-sm text-tertiary">Days {phase.days} — {phaseSolved}/{phaseTotal} solved</div>
                    </div>
                    {isCurrent && <span className="badge badge-info">Current</span>}
                  </div>
                  <div className="progress-bar mt-2">
                    <div className="progress-bar-fill" style={{ width: `${phaseTotal > 0 ? (phaseSolved / phaseTotal) * 100 : 0}%`, background: phase.gradient }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
