import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { Play, CircleCheck as CheckCircle, Clock, ArrowLeft, Code as Code2, Trophy, Save, Camera, CameraOff, Eye, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getDaySchedule, formatDuration, getTopicTypeBadge } from '../data/schedule'
import type { ProblemAttempt } from '../types'
import NotificationToast from '../components/NotificationToast'
import DayNightIcon from '../components/DayNightIcon'
import { runCodeWithValidation, type TestResult } from '../lib/codeRunner'

export default function CodeEditor() {
  const { dayNumber, questionId } = useParams()
  const navigate = useNavigate()
  const day = parseInt(dayNumber || '1')
  const schedule = getDaySchedule(day)
  const question = schedule.questions.find(q => q.id === questionId)

  const [code, setCode] = useState(question?.starterCode || '// Start coding here...')
  const [language, setLanguage] = useState('cpp')
  const [attempt, setAttempt] = useState<ProblemAttempt | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [accuracy, setAccuracy] = useState(0)
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Camera tracking state
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [focusState, setFocusState] = useState<'focused' | 'distracted' | 'away'>('away')
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadAttempt()
    startTimeRef.current = Date.now()
    return () => { stopCamera() }
  }, [questionId])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [questionId])

  const loadAttempt = async () => {
    if (!question) return
    const { data } = await supabase
      .from('problem_attempts')
      .select('*')
      .eq('day_number', day)
      .eq('problem_title', question.title)
      .maybeSingle()
    if (data) {
      setAttempt(data as ProblemAttempt)
      if (data.code_content) setCode(data.code_content)
      if (data.language) setLanguage(data.language)
      if (data.time_spent_seconds > 0) startTimeRef.current = Date.now() - (data.time_spent_seconds * 1000)
    }
  }

  const saveProgress = async (status: string, accuracyVal: number) => {
    if (!question) return
    setSavedStatus('saving')
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
    if (attempt) {
      const { data } = await supabase.from('problem_attempts').update({
        code_content: code, language, time_spent_seconds: totalTime, status, accuracy: accuracyVal,
        solved_at: status === 'solved' ? new Date().toISOString() : attempt.solved_at,
      }).eq('id', attempt.id).select().single()
      if (data) setAttempt(data as ProblemAttempt)
    } else {
      const { data } = await supabase.from('problem_attempts').insert({
        day_number: day, problem_title: question.title, problem_topic: question.topic,
        difficulty: question.difficulty, status, time_spent_seconds: totalTime, accuracy: accuracyVal,
        code_content: code, language, solved_at: status === 'solved' ? new Date().toISOString() : null,
      }).select().single()
      if (data) setAttempt(data as ProblemAttempt)
    }
    setSavedStatus('saved')
    setTimeout(() => setSavedStatus('idle'), 2000)
  }

  const runTests = () => {
    if (!question) return
    const testCases = question.testCases
    if (!testCases || testCases.length === 0) {
      setTestResults([])
      setAccuracy(0); return
    }
    setIsRunning(true)
    setTimeout(() => {
      const result = runCodeWithValidation(code, language, testCases)
      setTestResults(result.results)
      setAccuracy(result.accuracy)
      setIsRunning(false)
      saveProgress('attempted', result.accuracy)
    }, 500)
  }

  // Camera tracking functions
  const startCamera = async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true)
      startDetection()
    } catch { setCameraError('Could not access camera. Please grant permission.') }
  }

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
    setFaceDetected(false)
    setFocusState('away')
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
    if (focusIntervalRef.current) clearInterval(focusIntervalRef.current)
  }

  const startDetection = () => {
    detectionIntervalRef.current = setInterval(() => { detectFace() }, 2000)
    focusIntervalRef.current = setInterval(() => {
      if (!faceDetected) { setFocusState('away'); return }
      setFocusState(prev => prev === 'away' ? 'focused' : prev)
      setFocusSeconds(s => s + 1)
    }, 1000)
  }

  const detectFace = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current; const canvas = canvasRef.current
    const ctx = canvas.getContext('2d'); if (!ctx) return
    canvas.width = 160; canvas.height = 120
    ctx.drawImage(video, 0, 0, 160, 120)
    const imageData = ctx.getImageData(0, 0, 160, 120)
    const data = imageData.data
    let skinPixels = 0, totalPixels = 0, brightnessSum = 0, brightnessCount = 0
    for (let y = 20; y < 100; y += 2) {
      for (let x = 40; x < 120; x += 2) {
        const i = (y * 160 + x) * 4
        const r = data[i], g = data[i + 1], b = data[i + 2]
        brightnessSum += (r + g + b) / 3; brightnessCount++
        if (r > g && g > b && r > 60 && r - b > 15) skinPixels++
        totalPixels++
      }
    }
    const avgBrightness = brightnessCount > 0 ? brightnessSum / brightnessCount : 0
    const skinRatio = totalPixels > 0 ? skinPixels / totalPixels : 0
    const detected = skinRatio > 0.15 && avgBrightness > 40
    setFaceDetected(detected)
    setFocusState(detected ? 'focused' : 'away')
  }

  if (!question) {
    return (
      <div className="content-area">
        <div className="empty-state">
          <Code2 size={48} className="empty-state-icon" />
          <div className="empty-state-text">Question not found</div>
          <button className="btn btn-primary mt-4" onClick={() => navigate(`/day/${day}`)}>Back to Day {day}</button>
        </div>
      </div>
    )
  }

  const otherQuestions = schedule.questions.filter(q => q.id !== questionId)
  const cameraClass = cameraOn ? (focusState === 'focused' ? 'active' : focusState === 'distracted' ? 'distracted' : 'away') : ''

  return (
    <>
      <NotificationToast />
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/day/${day}`)}>
            <ArrowLeft size={14} /> Day {day}
          </button>
          <div className="topbar-title">{question.title}</div>
          <span className={`badge badge-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
          <span className={`badge ${getTopicTypeBadge(question.topicType)}`}>{question.topicType}</span>
        </div>
        <div className="topbar-right">
          <div className="timer-display">
            <Clock size={16} /> {formatDuration(elapsedSeconds)}
          </div>
          <DayNightIcon />
        </div>
      </div>

      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <div className="editor-body">
          <div className="editor-main">
            <div className="editor-header">
              <div className="editor-tabs">
                <div className="editor-tab active">Solution</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select className="input" style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
                  value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="cpp">C++</option><option value="java">Java</option>
                  <option value="python">Python</option><option value="javascript">JavaScript</option>
                </select>
                {savedStatus === 'saving' && <span className="text-sm text-tertiary">Saving...</span>}
                {savedStatus === 'saved' && <span className="text-sm text-green">Saved!</span>}
                {!cameraOn ? (
                  <button className="btn btn-secondary btn-sm" onClick={startCamera} title="Enable camera focus tracking">
                    <Camera size={14} /> Track Focus
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={stopCamera} title="Turn off camera">
                    <CameraOff size={14} /> Stop
                  </button>
                )}
              </div>
            </div>
            <div className="editor-code-area" style={{ position: 'relative' }}>
              <Editor height="100%" language={language === 'cpp' ? 'cpp' : language} theme="vs-dark"
                value={code} onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 14, fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  minimap: { enabled: false }, scrollBeyondLastLine: false,
                  padding: { top: 16 }, lineNumbers: 'on', renderLineHighlight: 'all',
                  smoothScrolling: true, cursorBlinking: 'smooth', tabSize: 4,
                }}
              />
              {cameraOn && (
                <div className={`editor-camera-panel ${cameraClass}`}>
                  <video ref={videoRef} className="editor-camera-video" autoPlay playsInline muted />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="editor-camera-label">
                    {focusState === 'focused' ? 'FOCUSED' : focusState === 'distracted' ? 'DISTRACTED' : 'AWAY'} — {formatDuration(focusSeconds)}
                  </div>
                </div>
              )}
              {cameraError && (
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', padding: '8px 12px',
                  background: 'rgba(153,27,27,0.80)', backdropFilter: 'blur(14px)', borderRadius: 'var(--r-md)', fontSize: '12px', color: 'white' }}>
                  {cameraError}
                </div>
              )}
            </div>
            <div className="editor-footer">
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => saveProgress('attempted', accuracy)}>
                  <Save size={14} /> Save
                </button>
                <button className="btn btn-secondary btn-sm" onClick={runTests} disabled={isRunning}>
                  <Play size={14} /> {isRunning ? 'Running...' : 'Run Tests'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {testResults.length > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: accuracy === 100 ? '#e8e8e8' : '#a0a0a0' }}>
                    {testResults.filter(r => r.passed).length}/{testResults.length} passed
                  </span>
                )}
                <button className="btn btn-success btn-sm" onClick={() => saveProgress('solved', accuracy || 100)}>
                  <CheckCircle size={14} /> Mark Solved
                </button>
              </div>
            </div>
          </div>

          <div className="editor-sidebar">
            <div style={{ padding: '20px' }}>
              <div className="section-title" style={{ marginBottom: '12px' }}>
                <Code2 size={16} style={{ color: '#ffffff' }} /> Problem
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '8px' }}>{question.title}</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span className={`badge badge-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
                <span className={`badge ${getTopicTypeBadge(question.topicType)}`}>{question.topicType}</span>
                <span className="badge badge-info">{question.topic}</span>
              </div>
              {question.description && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-md)', borderLeft: '3px solid #ffffff' }}>
                  {question.description}
                </div>
              )}

              {question.testCases && question.testCases.length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: '20px', marginBottom: '12px', fontSize: '14px' }}>Test Cases</div>
                  {testResults.length > 0 && (
                    <div className={`test-result-summary ${testResults.every(r => r.passed) ? 'all-passed' : 'some-failed'}`}>
                      {testResults.filter(r => r.passed).length} / {testResults.length} passed — {accuracy}% accuracy
                    </div>
                  )}
                  {testResults.length > 0 ? (
                    testResults.map((r, i) => (
                      <div key={i} className={`test-case ${r.passed ? 'test-case-passed' : 'test-case-failed'}`}>
                        <div className="test-case-label">
                          {r.passed ? '✓' : '✗'} Test {i + 1} — {r.passed ? 'Passed' : 'Failed'}
                        </div>
                        <div className="test-case-content">
                          <div>Input: {r.input}</div>
                          <div>Expected: {r.expected}</div>
                          <div>Output: {r.output}</div>
                          {r.error && <div style={{ color: 'var(--red-bright)', marginTop: '4px' }}>Error: {r.error}</div>}
                        </div>
                      </div>
                    ))
                  ) : (
                    question.testCases.map((tc, i) => (
                      <div key={i} className="test-case">
                        <div className="test-case-label">Test Case {i + 1}</div>
                        <div className="test-case-content"><div>Input: {tc.input}</div><div>Expected: {tc.expected}</div></div>
                      </div>
                    ))
                  )}
                </>
              )}

              {attempt && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div className="section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                    <Trophy size={16} style={{ color: 'var(--amber-bright)' }} /> Your Progress
                  </div>
                  <div className="text-sm" style={{ marginBottom: '4px' }}>Status: <span style={{ color: attempt.status === 'solved' ? 'var(--green-bright)' : 'var(--amber-bright)', fontWeight: 700 }}>{attempt.status}</span></div>
                  <div className="text-sm" style={{ marginBottom: '4px' }}>Time: {formatDuration(attempt.time_spent_seconds)}</div>
                  <div className="text-sm">Accuracy: {attempt.accuracy}%</div>
                </div>
              )}

              {cameraOn && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div className="section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                    <Eye size={16} style={{ color: 'var(--green-bright)' }} /> Focus While Coding
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: focusState === 'focused' ? 'var(--green-bright)' : 'var(--text-tertiary)' }}>{formatDuration(focusSeconds)}</div>
                      <div className="text-xs text-tertiary">Focused</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: faceDetected ? 'var(--green-bright)' : 'var(--red-bright)' }}>{faceDetected ? 'YES' : 'NO'}</div>
                      <div className="text-xs text-tertiary">Face</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
              <div className="section-title" style={{ marginTop: '16px', fontSize: '14px' }}>
                <Zap size={16} style={{ color: 'var(--amber-bright)' }} /> More Questions
              </div>
              {otherQuestions.map((q, i) => (
                <div key={q.id} className="question-item" style={{ padding: '10px 12px', marginBottom: '6px' }}
                  onClick={() => navigate(`/day/${day}/editor/${q.id}`)}>
                  <div className="question-number" style={{ width: '24px', height: '24px', fontSize: '11px' }}>{i + 1}</div>
                  <div className="question-info"><div style={{ fontSize: '13px', fontWeight: 600 }}>{q.title}</div></div>
                  <span className={`badge badge-${q.difficulty.toLowerCase()}`} style={{ fontSize: '10px' }}>{q.difficulty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
