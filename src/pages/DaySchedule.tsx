import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Code as Code2, BookOpen, RotateCcw, CircleCheck as CheckCircle, ArrowLeft, Calendar, Zap, Brain, Trophy, Video, Square, Download, Film, Disc } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getDaySchedule, formatTime, formatDuration, getTopicTypeBadge } from '../data/schedule'
import type { ProblemAttempt, StudySession, StudyRecording } from '../types'
import NotificationToast from '../components/NotificationToast'
import DayNightIcon from '../components/DayNightIcon'
import { useCamera } from '../components/CameraContext'

const PHASE_GRADIENTS: Record<number, string> = {
  1: 'rgba(37,99,235,0.85)',
  2: 'rgba(21,128,61,0.85)',
  3: 'rgba(146,64,14,0.85)',
  4: 'rgba(153,27,27,0.85)',
  5: 'rgba(55,48,163,0.85)',
}

const BLOCK_TYPE_COLORS: Record<string, string> = {
  dsa: '#1d4ed8',
  fundamentals: '#0f766e',
  revision: '#92400e',
  'lld-hld': '#6b21a8',
  mock: '#991b1b',
  flashcard: '#1e40af',
}

export default function DaySchedule() {
  const { dayNumber } = useParams()
  const navigate = useNavigate()
  const day = parseInt(dayNumber || '1')
  const schedule = getDaySchedule(day)
  const { enabled: cameraEnabled, recording, startRecording, stopRecording, recorderRef, chunksRef, error: cameraError, startCamera } = useCamera()

  const [attempts, setAttempts] = useState<ProblemAttempt[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [recordings, setRecordings] = useState<StudyRecording[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string>('')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null)
  const [lastFileName, setLastFileName] = useState<string>('')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const selectedBlockRef = useRef<string>('')

  useEffect(() => { loadData() }, [day])

  useEffect(() => {
    selectedBlockRef.current = selectedBlockId
  }, [selectedBlockId])

  useEffect(() => {
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current)
      if (lastDownloadUrl) URL.revokeObjectURL(lastDownloadUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    const { data: attemptData } = await supabase.from('problem_attempts').select('*').eq('day_number', day)
    setAttempts(attemptData || [])
    const { data: sessionData } = await supabase.from('study_sessions').select('*').eq('day_number', day)
    setSessions(sessionData || [])
    const { data: recData } = await supabase.from('study_recordings').select('*').eq('day_number', day).order('created_at', { ascending: false })
    setRecordings((recData || []) as StudyRecording[])
  }

  const studyBlocks = schedule.blocks.filter(b => b.type === 'study')

  const handleStartRecording = () => {
    if (!cameraEnabled) { startCamera(); return }
    const block = studyBlocks.find(b => b.id === selectedBlockId) || studyBlocks[0]
    if (!block) return
    setSelectedBlockId(block.id)
    selectedBlockRef.current = block.id
    startTimeRef.current = new Date()
    setElapsedSec(0)
    setLastDownloadUrl(null)
    setSaveStatus(null)
    const rec = startRecording()
    if (!rec) { setSaveStatus('Could not start recording. Camera may be in use.'); return }
    rec.onstop = handleRecordingStop
    elapsedRef.current = setInterval(() => {
      setElapsedSec(s => s + 1)
    }, 1000)
  }

  const handleStopRecording = () => {
    stopRecording()
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
  }

  const handleRecordingStop = async () => {
    const duration = elapsedSec
    const block = studyBlocks.find(b => b.id === selectedBlockRef.current) || studyBlocks[0]
    if (!block) return
    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
    if (blob.size === 0) { setSaveStatus('Recording was empty.'); return }
    const url = URL.createObjectURL(blob)
    if (lastDownloadUrl) URL.revokeObjectURL(lastDownloadUrl)
    setLastDownloadUrl(url)
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `day${day}_${block.id}_${dateStr}.webm`
    setLastFileName(fileName)
    try {
      await supabase.from('study_recordings').insert({
        day_number: day,
        block_name: block.name,
        topic: block.topic || block.name,
        duration_seconds: duration,
        note: '',
        file_name: fileName,
      })
      setSaveStatus('Recording saved! Download below.')
      loadData()
    } catch {
      setSaveStatus('Recording saved locally. Download below.')
    }
  }

  const downloadLastRecording = () => {
    if (!lastDownloadUrl) return
    const a = document.createElement('a')
    a.href = lastDownloadUrl
    a.download = lastFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
          <div className="phase-number" style={{ background: PHASE_GRADIENTS[schedule.phase] || 'rgba(37,99,235,0.80)' }}>
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
            <div style={{ fontSize: '28px', fontWeight: 900, color: solvedCount === schedule.questions.length ? '#4ade80' : 'var(--text-primary)' }}>
              {solvedCount}<span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>/{schedule.questions.length}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solved</div>
          </div>
        </div>

        {/* Recording Panel */}
        <div className={`recording-panel animate-fadeIn ${recording ? 'recording' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Film size={20} color={recording ? '#f87171' : '#93c5fd'} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800 }}>Study Session Recording</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Record your 2-hour study block with live video. Download when done.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {recording && (
                <div className="recording-indicator">
                  <span className="recording-dot" />
                  REC {formatDuration(elapsedSec)}
                </div>
              )}
              {!recording ? (
                <button className="btn btn-danger" onClick={handleStartRecording} disabled={studyBlocks.length === 0}>
                  <Video size={14} /> Start Recording
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={handleStopRecording}>
                  <Square size={14} /> Stop & Save
                </button>
              )}
            </div>
          </div>

          {cameraError && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: 'var(--r-md)', background: 'rgba(45,15,15,0.60)', backdropFilter: 'blur(14px)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '12px', color: '#f87171' }}>
              {cameraError}
            </div>
          )}

          {saveStatus && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: 'var(--r-md)', background: 'rgba(10,26,16,0.60)', backdropFilter: 'blur(14px)', border: '1px solid rgba(34,197,94,0.25)', fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} />
              {saveStatus}
              {lastDownloadUrl && (
                <button className="btn btn-primary btn-sm" onClick={downloadLastRecording} style={{ marginLeft: 'auto' }}>
                  <Download size={12} /> Download Video
                </button>
              )}
            </div>
          )}

          {/* Block selector */}
          {!recording && studyBlocks.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Select Study Block to Record
              </div>
              {studyBlocks.map(block => (
                <div
                  key={block.id}
                  className={`recording-plan-item ${selectedBlockId === block.id ? 'selected' : ''} ${isBlockActive(block) ? 'active' : ''}`}
                  onClick={() => setSelectedBlockId(block.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLOCK_TYPE_COLORS[block.blockType || 'dsa'] || 'var(--blue)' }} />
                  <div className="flex-1">
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>{block.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {formatTime(block.startHour, block.startMinute)} — {block.topic || 'Study block'}
                    </div>
                  </div>
                  {isBlockActive(block) && <span className="badge badge-info">LIVE</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Recording Plan */}
        <div className="card animate-fadeIn" style={{ marginBottom: '16px' }}>
          <div className="section-title">
            <Disc size={18} style={{ color: '#c4b5fd' }} />
            Today's Recording Plan
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            These are the study blocks you should record today. Aim for 2 hours per session.
          </div>
          {studyBlocks.map(block => (
            <div key={block.id} className="recording-plan-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedBlockId(block.id)}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLOCK_TYPE_COLORS[block.blockType || 'dsa'] || 'var(--blue)' }} />
              <div className="flex-1">
                <div style={{ fontSize: '12px', fontWeight: 700 }}>{block.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  {formatTime(block.startHour, block.startMinute)} ({Math.floor(block.durationMinutes / 60)}h {block.durationMinutes % 60}m) — {block.topic || 'Study'}
                </div>
              </div>
              {isBlockActive(block) && <span className="badge badge-info">LIVE NOW</span>}
            </div>
          ))}
        </div>

        {/* Past Recordings */}
        {recordings.length > 0 && (
          <div className="card animate-fadeIn" style={{ marginBottom: '16px' }}>
            <div className="section-title">
              <Film size={18} style={{ color: '#93c5fd' }} />
              Past Recordings ({recordings.length})
            </div>
            {recordings.map(rec => (
              <div key={rec.id} className="recording-history-item">
                <Film size={16} color="#93c5fd" />
                <div className="flex-1">
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{rec.block_name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {rec.topic} — {formatDuration(rec.duration_seconds)} — {new Date(rec.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{rec.file_name}</span>
              </div>
            ))}
          </div>
        )}

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
