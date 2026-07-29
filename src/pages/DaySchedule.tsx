import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Code as Code2, BookOpen, RotateCcw, CircleCheck as CheckCircle, ArrowLeft, Calendar, Zap, Brain, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getDaySchedule, formatTime, formatDuration, getTopicTypeBadge } from '../data/schedule'
import type { ProblemAttempt, StudySession } from '../types'
import NotificationToast from '../components/NotificationToast'
import DayNightIcon from '../components/DayNightIcon'

const PHASE_GRADIENTS: Record<number, string> = {
  1: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  2: 'linear-gradient(135deg, #10b981, #3b82f6)',
  3: 'linear-gradient(135deg, #f59e0b, #f97316)',
  4: 'linear-gradient(135deg, #ef4444, #ec4899)',
  5: 'linear-gradient(135deg, #ec4899, #6366f1)',
}

const BLOCK_TYPE_COLORS: Record<string, string> = {
  dsa: 'var(--blue)',
  fundamentals: 'var(--teal)',
  revision: 'var(--amber)',
  'lld-hld': 'var(--pink)',
  mock: 'var(--red)',
  flashcard: 'var(--cyan)',
}

export default function DaySchedule() {
  const { dayNumber } = useParams()
  const navigate = useNavigate()
  const day = parseInt(dayNumber || '1')
  const schedule = getDaySchedule(day)

  const [attempts, setAttempts] = useState<ProblemAttempt[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])

  useEffect(() => { loadData() }, [day])

  const loadData = async () => {
    const { data: attemptData } = await supabase.from('problem_attempts').select('*').eq('day_number', day)
    setAttempts(attemptData || [])
    const { data: sessionData } = await supabase.from('study_sessions').select('*').eq('day_number', day)
    setSessions(sessionData || [])
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const isBlockActive = (block: typeof schedule.blocks[0]) => {
    const start = block.startHour * 60 + block.startMinute
    const end = start + block.durationMinutes
    return currentMinutes >= start && currentMinutes < end
  }

  const solvedCount = attempts.filter(a => a.status === 'solved').length
  const totalStudySeconds = sessions.reduce((sum, s) => sum + (s.actual_duration_seconds || 0), 0)

  return (
    <>
      <NotificationToast />
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="topbar-title">Day {day} — {schedule.date}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="day-pill">
            <Calendar size={14} />
            Phase {schedule.phase}: {schedule.phaseName}
          </div>
          <DayNightIcon />
        </div>
      </div>

      <div className="content-area">
        <div className="phase-banner animate-fadeIn">
          <div className="phase-number" style={{ background: PHASE_GRADIENTS[schedule.phase] }}>
            {schedule.phase}
          </div>
          <div className="flex-1" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em' }}>{schedule.dsaTopic}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Fundamentals: {schedule.fundamentalsTopic}
            </div>
            {schedule.revisionDays.length > 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Revision: Days {schedule.revisionDays.join(', ')}
              </div>
            )}
            {schedule.isWeeklyPractice && (
              <div style={{ marginTop: '6px' }}>
                <span className="badge badge-orange">
                  <Trophy size={10} /> Weekly Mixed Practice Day
                </span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: solvedCount === schedule.questions.length ? 'var(--green-bright)' : 'var(--text-primary)' }}>
              {solvedCount}<span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>/{schedule.questions.length}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solved</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card animate-fadeIn">
            <div className="section-title">
              <Clock size={18} style={{ color: 'var(--blue-bright)' }} />
              Daily Schedule
            </div>
            <div className="timeline">
              {schedule.blocks.map((block) => {
                const active = isBlockActive(block)
                const endMinutes = block.startHour * 60 + block.startMinute + block.durationMinutes
                const endHour = Math.floor(endMinutes / 60) % 24
                const endMin = endMinutes % 60
                return (
                  <div key={block.id} className="timeline-item">
                    <div className={`timeline-dot ${block.type} ${active ? 'active' : ''}`}
                      style={block.blockType ? { background: BLOCK_TYPE_COLORS[block.blockType] } : {}}
                    />
                    <div className={`timeline-card ${active ? 'active' : ''}`}
                      style={block.blockType ? { borderLeft: `3px solid ${BLOCK_TYPE_COLORS[block.blockType]}` } : {}}
                    >
                      <div className="timeline-time">
                        {formatTime(block.startHour, block.startMinute)} — {formatTime(endHour, endMin)}
                        <span style={{ marginLeft: '8px', color: 'var(--text-tertiary)' }}>
                          ({Math.floor(block.durationMinutes / 60)}h {block.durationMinutes % 60}m)
                        </span>
                        {active && <span className="badge badge-info" style={{ marginLeft: '8px' }}>LIVE</span>}
                      </div>
                      <div className="timeline-title">{block.name}</div>
                      {block.topic && <div className="timeline-topic">{block.topic}</div>}
                      {block.description && <div className="timeline-desc">{block.description}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card animate-fadeIn">
            <div className="section-title">
              <Code2 size={18} style={{ color: 'var(--blue-bright)' }} />
              DSA Questions ({schedule.questions.length})
            </div>
            <div className="question-list">
              {schedule.questions.map((q, i) => {
                const attempt = attempts.find(a => a.problem_title === q.title)
                const isSolved = attempt?.status === 'solved'
                return (
                  <div
                    key={q.id}
                    className={`question-item ${isSolved ? 'solved' : ''}`}
                    onClick={() => navigate(`/day/${day}/editor/${q.id}`)}
                  >
                    <div className="question-number">{i + 1}</div>
                    <div className="question-info">
                      <div className="question-title">{q.title}</div>
                      <div className="question-meta">
                        <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                        <span className={`badge ${getTopicTypeBadge(q.topicType)}`}>{q.topicType}</span>
                        <span>{q.topic}</span>
                        {attempt && <span style={{ color: 'var(--text-tertiary)' }}>{formatDuration(attempt.time_spent_seconds)}</span>}
                      </div>
                    </div>
                    {isSolved ? (
                      <CheckCircle size={18} color="var(--green-bright)" />
                    ) : attempt ? (
                      <div className="question-status status-attempted">In Progress</div>
                    ) : (
                      <div className="question-status status-unsolved">Solve</div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <div className="section-title">
                <BookOpen size={18} style={{ color: 'var(--teal-bright)' }} />
                Fundamentals
              </div>
              <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '3px solid var(--teal)' }}>
                <div className="font-700" style={{ marginBottom: '4px' }}>{schedule.fundamentalsTopic}</div>
                <div className="text-sm text-tertiary">
                  Block 3 — 1.5 hours. Deep study of today's fundamentals rotation subject.
                </div>
              </div>
            </div>

            {schedule.revisionDays.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div className="section-title">
                  <RotateCcw size={18} style={{ color: 'var(--amber-bright)' }} />
                  Spaced Revision
                </div>
                {schedule.revisionDays.map(rd => {
                  const revSchedule = getDaySchedule(rd)
                  return (
                    <div key={rd} className="card" style={{ background: 'var(--bg-tertiary)', marginBottom: '8px', borderLeft: '3px solid var(--amber)' }}>
                      <div className="font-700">Day {rd}: {revSchedule.dsaTopic}</div>
                      <div className="text-sm text-tertiary">Solve 1 fresh problem cold from this day's topic</div>
                    </div>
                  )
                })}
              </div>
            )}

            {schedule.isWeeklyPractice && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div className="section-title">
                  <Trophy size={18} style={{ color: 'var(--orange-bright)' }} />
                  Weekly Mixed Practice
                </div>
                <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '3px solid var(--orange)' }}>
                  <div className="font-700">2h Timed Mixed Set</div>
                  <div className="text-sm text-tertiary">
                    Block 6 becomes a timed practice set today. Pick 4-5 random problems from any week so far and solve under time pressure.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/day/${Math.max(1, day - 1)}`)} disabled={day <= 1} style={{ opacity: day <= 1 ? 0.4 : 1 }}>
            <ArrowLeft size={14} /> Previous Day
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/day/${Math.min(55, day + 1)}`)} disabled={day >= 55} style={{ opacity: day >= 55 ? 0.4 : 1 }}>
            Next Day <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>
    </>
  )
}
