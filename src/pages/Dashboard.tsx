import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CircleCheck as CheckCircle, Target, TrendingUp, Calendar, Code as Code2, Eye, CircleAlert as AlertCircle, ArrowRight, Flame, Zap, Award, Brain } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getTodayDayNumber, getDaySchedule, formatDuration, PHASES, getTopicTypeBadge } from '../data/schedule'
import type { ProblemAttempt, FocusLog, WeakTopic } from '../types'
import NotificationToast from '../components/NotificationToast'
import DayNightIcon from '../components/DayNightIcon'

export default function Dashboard() {
  const navigate = useNavigate()
  const todayDay = getTodayDayNumber()
  const schedule = getDaySchedule(todayDay)

  const [attempts, setAttempts] = useState<ProblemAttempt[]>([])
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [totalStudySeconds, setTotalStudySeconds] = useState(0)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: attemptData } = await supabase.from('problem_attempts').select('*')
    setAttempts(attemptData || [])
    const { data: focusData } = await supabase.from('focus_logs').select('*')
    setFocusLogs(focusData || [])
    const { data: weakData } = await supabase.from('weak_topics').select('*').eq('resolved', false)
    setWeakTopics(weakData || [])
    const totalFocus = (focusData || []).reduce((sum, f) => sum + (f.focused_seconds || 0), 0)
    setTotalStudySeconds(totalFocus)
  }

  const solvedToday = attempts.filter(a => a.day_number === todayDay && a.status === 'solved')
  const solvedAll = attempts.filter(a => a.status === 'solved')
  const todayFocus = focusLogs.filter(f => f.day_number === todayDay)
  const todayFocusedSeconds = todayFocus.reduce((sum, f) => sum + (f.focused_seconds || 0), 0)
  const avgAccuracy = solvedAll.length > 0 ? Math.round(solvedAll.reduce((sum, a) => sum + (a.accuracy || 0), 0) / solvedAll.length) : 0

  const currentPhase = PHASES.find(p => p.number === schedule.phase)
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const getCurrentBlock = () => {
    return schedule.blocks.find(b => {
      const start = b.startHour * 60 + b.startMinute
      const end = start + b.durationMinutes
      return currentMinutes >= start && currentMinutes < end
    })
  }
  const currentBlock = getCurrentBlock()

  return (
    <>
      <NotificationToast />
      <div className="topbar">
        <div className="topbar-title">Dashboard</div>
        <div className="topbar-right">
          <div className="day-pill">
            <Flame size={14} className="flame" />
            Day {todayDay} / 55
          </div>
          <DayNightIcon />
        </div>
      </div>
      <div className="content-area">
        <div className="phase-banner animate-fadeIn">
          <div className="phase-number" style={{ background: currentPhase?.gradient || 'rgba(37,99,235,0.80)' }}>
            {schedule.phase}
          </div>
          <div className="flex-1" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em' }}>{currentPhase?.name}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Day {todayDay} — {schedule.dsaTopic}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/day/${todayDay}`)} style={{ position: 'relative', zIndex: 1 }}>
            View Today's Schedule
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="stat-grid">
          <div className="stat-card blue animate-fadeIn">
            <div className="stat-label"><Clock size={14} /> Focused Study Time</div>
            <div className="stat-value">{formatDuration(todayFocusedSeconds)}</div>
            <div className="stat-sub">Today's focused hours</div>
          </div>
          <div className="stat-card green animate-fadeIn">
            <div className="stat-label"><CheckCircle size={14} /> Problems Solved</div>
            <div className="stat-value">{solvedToday.length} <span style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>/ {schedule.questions.length}</span></div>
            <div className="stat-sub">{solvedAll.length} total across all days</div>
          </div>
          <div className="stat-card amber animate-fadeIn">
            <div className="stat-label"><TrendingUp size={14} /> Avg Accuracy</div>
            <div className="stat-value">{avgAccuracy}%</div>
            <div className="stat-sub">Across all solved problems</div>
          </div>
          <div className="stat-card pink animate-fadeIn">
            <div className="stat-label"><Target size={14} /> Total Focus Time</div>
            <div className="stat-value">{formatDuration(totalStudySeconds)}</div>
            <div className="stat-sub">All-time focused study</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card animate-fadeIn">
            <div className="section-title">
              <Zap size={18} style={{ color: '#fbbf24' }} />
              Current Activity
            </div>
            {currentBlock ? (
              <div>
                <div className="timeline-card active" style={{ marginBottom: '12px' }}>
                  <div className="timeline-time">
                    {formatTimeStr(currentBlock.startHour, currentBlock.startMinute)} — {formatTimeStr(
                      Math.floor((currentBlock.startHour * 60 + currentBlock.durationMinutes) / 60),
                      (currentBlock.startHour * 60 + currentBlock.durationMinutes) % 60
                    )}
                  </div>
                  <div className="timeline-title">{currentBlock.name}</div>
                  {currentBlock.topic && <div className="timeline-topic">{currentBlock.topic}</div>}
                  {currentBlock.description && <div className="timeline-desc">{currentBlock.description}</div>}
                </div>
                {currentBlock.type === 'study' && (
                  <button className="btn btn-success w-full" onClick={() => navigate('/focus')}>
                    <Eye size={14} />
                    Start Focus Tracking
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <Clock size={32} className="empty-state-icon" />
                <div className="empty-state-text">No active study block right now</div>
              </div>
            )}
          </div>

          <div className="card animate-fadeIn">
            <div className="section-title">
              <Code2 size={18} style={{ color: '#93c5fd' }} />
              Today's DSA Questions
            </div>
            <div className="question-list">
              {schedule.questions.slice(0, 4).map((q, i) => {
                const attempt = attempts.find(a => a.day_number === todayDay && a.problem_title === q.title)
                return (
                  <div
                    key={q.id}
                    className={`question-item ${attempt?.status === 'solved' ? 'solved' : ''}`}
                    onClick={() => navigate(`/day/${todayDay}/editor/${q.id}`)}
                  >
                    <div className="question-number">{i + 1}</div>
                    <div className="question-info">
                      <div className="question-title">{q.title}</div>
                      <div className="question-meta">
                        <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                        <span className={`badge ${getTopicTypeBadge(q.topicType)}`}>{q.topicType}</span>
                        <span>{q.topic}</span>
                      </div>
                    </div>
                    {attempt?.status === 'solved' ? (
                      <CheckCircle size={18} color="#4ade80" />
                    ) : (
                      <ArrowRight size={16} color="var(--text-tertiary)" />
                    )}
                  </div>
                )
              })}
              {schedule.questions.length > 4 && (
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/day/${todayDay}`)}>
                  View all {schedule.questions.length} questions
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card animate-fadeIn mt-4">
          <div className="section-title">
            <AlertCircle size={18} style={{ color: '#c4b5fd' }} />
            Weak Topics ({weakTopics.length})
          </div>
          {weakTopics.length > 0 ? (
            <div className="question-list">
              {weakTopics.slice(0, 5).map(t => (
                <div key={t.id} className="weak-topic-item">
                  <AlertCircle size={16} color={
                    t.severity === 'high' ? '#f87171' : t.severity === 'medium' ? '#fbbf24' : 'var(--text-tertiary)'
                  } />
                  <div className="flex-1">
                    <div className="font-700">{t.topic_name}</div>
                    {t.notes && <div className="text-sm text-tertiary">{t.notes}</div>}
                  </div>
                  <span className={`badge ${t.severity === 'high' ? 'badge-hard' : 'badge-medium'}`}>{t.severity}</span>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/weak-topics')}>
                Manage Weak Topics
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <Brain size={32} className="empty-state-icon" />
              <div className="empty-state-text">No weak topics marked yet</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function formatTimeStr(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:${minute.toString().padStart(2, '0')} ${period}`
}
