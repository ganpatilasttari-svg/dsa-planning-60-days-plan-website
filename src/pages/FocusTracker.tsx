import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Play, Square, Camera, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Zap, Brain } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getTodayDayNumber, formatDuration } from '../data/schedule'
import NotificationToast from '../components/NotificationToast'
import DayNightIcon from '../components/DayNightIcon'
import { useCamera } from '../components/CameraContext'

export default function FocusTracker() {
  const todayDay = getTodayDayNumber()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { stream, enabled: cameraOn, recording, startCamera, stopCamera } = useCamera()

  const [isTracking, setIsTracking] = useState(false)
  const [focusedSeconds, setFocusedSeconds] = useState(0)
  const [distractedSeconds, setDistractedSeconds] = useState(0)
  const [awaySeconds, setAwaySeconds] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  const [lookingAtScreen, setLookingAtScreen] = useState(true)
  const [focusScore, setFocusScore] = useState(0)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [history, setHistory] = useState<any[]>([])

  const trackingRef = useRef(false)
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadHistory()
    return () => {
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current)
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream, cameraOn])

  const loadHistory = async () => {
    const { data } = await supabase.from('focus_logs').select('*').order('created_at', { ascending: false }).limit(10)
    setHistory(data || [])
  }

  const startTracking = () => {
    if (!cameraOn) { startCamera(); return }
    setIsTracking(true); trackingRef.current = true; setSessionStart(new Date())
    setFocusedSeconds(0); setDistractedSeconds(0); setAwaySeconds(0)
    detectionIntervalRef.current = setInterval(() => detectFace(), 2000)
    focusIntervalRef.current = setInterval(() => {
      if (!trackingRef.current) return
      if (faceDetected && lookingAtScreen) setFocusedSeconds(s => s + 1)
      else if (!faceDetected) setAwaySeconds(s => s + 1)
      else setDistractedSeconds(s => s + 1)
    }, 1000)
  }

  const stopTracking = async () => {
    setIsTracking(false); trackingRef.current = false
    if (focusIntervalRef.current) clearInterval(focusIntervalRef.current)
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
    const totalSec = focusedSeconds + distractedSeconds + awaySeconds
    const score = totalSec > 0 ? Math.round((focusedSeconds / totalSec) * 100) : 0
    setFocusScore(score)
    if (sessionStart && totalSec > 5) {
      await supabase.from('focus_logs').insert({
        day_number: todayDay, session_start: sessionStart.toISOString(), session_end: new Date().toISOString(),
        total_seconds: totalSec, focused_seconds: focusedSeconds, distracted_seconds: distractedSeconds,
        away_seconds: awaySeconds, focus_score: score,
      })
      loadHistory()
    }
  }

  const detectFace = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current, canvas = canvasRef.current, ctx = canvas.getContext('2d')
    if (!ctx) return
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
    setFaceDetected(detected); setLookingAtScreen(detected && avgBrightness > 40)
  }

  const totalSeconds = focusedSeconds + distractedSeconds + awaySeconds
  const liveFocusScore = totalSeconds > 0 ? Math.round((focusedSeconds / totalSeconds) * 100) : 0

  return (
    <>
      <NotificationToast />
      <div className="topbar">
        <div className="topbar-title">AI Focus Tracker</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="day-pill"><Eye size={14} /> Day {todayDay}</div>
          <DayNightIcon />
        </div>
      </div>

      <div className="content-area">
        <div className="grid-2">
          <div className="card animate-fadeIn">
            <div className="section-title">
              <Camera size={18} style={{ color: '#38bdf8' }} /> Camera Feed
            </div>
            <div className="camera-container">
              <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {!cameraOn && (
                <div className="camera-placeholder">
                  <Camera size={48} />
                  <div>Camera is off</div>
                  <button className="btn btn-primary mt-4" onClick={startCamera}>
                    <Camera size={14} /> Enable Camera
                  </button>
                </div>
              )}
              {isTracking && cameraOn && (
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                  <div style={{ padding: '4px 10px', borderRadius: '20px', background: faceDetected ? 'rgba(21,128,61,0.70)' : 'rgba(153,27,27,0.70)', backdropFilter: 'blur(14px)', fontSize: '11px', fontWeight: 700, color: 'white' }}>
                    {faceDetected ? 'Face Detected' : 'No Face'}
                  </div>
                  {faceDetected && (
                    <div style={{ padding: '4px 10px', borderRadius: '20px', background: lookingAtScreen ? 'rgba(21,128,61,0.70)' : 'rgba(146,64,14,0.70)', backdropFilter: 'blur(14px)', fontSize: '11px', fontWeight: 700, color: 'white' }}>
                      {lookingAtScreen ? 'Focused' : 'Distracted'}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              {!isTracking ? (
                <button className="btn btn-success" onClick={startTracking} disabled={!cameraOn || recording}>
                  <Play size={14} /> Start Focus Tracking
                </button>
              ) : (
                <button className="btn btn-danger" onClick={stopTracking}>
                  <Square size={14} /> Stop & Save Session
                </button>
              )}
              {cameraOn && (
                <button className="btn btn-secondary" onClick={stopCamera}>
                  <EyeOff size={14} /> Turn Off Camera
                </button>
              )}
            </div>
            {recording && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#ffab00' }}>
                Video recording is active — focus tracking is disabled during recording.
              </div>
            )}
          </div>

          <div className="card animate-fadeIn">
            <div className="section-title">
              <Zap size={18} style={{ color: '#ffab00' }} /> Live Focus Stats
            </div>
            <div className="focus-stats mb-4">
              <div className="focus-stat">
                <div className="focus-stat-value" style={{ color: '#00e676' }}>{formatDuration(focusedSeconds)}</div>
                <div className="focus-stat-label">Focused</div>
              </div>
              <div className="focus-stat">
                <div className="focus-stat-value" style={{ color: '#ffab00' }}>{formatDuration(distractedSeconds)}</div>
                <div className="focus-stat-label">Distracted</div>
              </div>
              <div className="focus-stat">
                <div className="focus-stat-value" style={{ color: '#ff4060' }}>{formatDuration(awaySeconds)}</div>
                <div className="focus-stat-label">Away</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-sm font-700">Focus Score</span>
                <span className="font-mono font-900" style={{ color: liveFocusScore > 70 ? '#00e676' : liveFocusScore > 40 ? '#ffab00' : '#ff4060' }}>{liveFocusScore}%</span>
              </div>
              <div className="focus-bar">
                <div className="focus-bar-fill" style={{ width: `${liveFocusScore}%`, background: liveFocusScore > 70 ? '#22c55e' : liveFocusScore > 40 ? '#f59e0b' : '#ef4444' }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-sm font-700">Total Session Time</span>
                <span className="font-mono font-900">{formatDuration(totalSeconds)}</span>
              </div>
              <div className="focus-bar">
                <div style={{ display: 'flex', height: '100%' }}>
                  <div style={{ width: `${totalSeconds > 0 ? (focusedSeconds / totalSeconds) * 100 : 0}%`, background: '#22c55e' }} />
                  <div style={{ width: `${totalSeconds > 0 ? (distractedSeconds / totalSeconds) * 100 : 0}%`, background: '#f59e0b' }} />
                  <div style={{ width: `${totalSeconds > 0 ? (awaySeconds / totalSeconds) * 100 : 0}%`, background: '#ef4444' }} />
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(6,9,22,0.60)', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {faceDetected ? <CheckCircle size={16} color="#00e676" /> : <AlertTriangle size={16} color="#ff4060" />}
                <span className="text-sm">
                  {faceDetected ? (lookingAtScreen ? 'You are focused and looking at the screen. Keep it up!' : 'Face detected but you seem distracted. Focus on your study material.') : 'No face detected. Make sure you are in front of the camera.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card animate-fadeIn mt-4">
          <div className="section-title">
            <Clock size={18} style={{ color: '#38bdf8' }} /> Recent Focus Sessions
          </div>
          {history.length > 0 ? (
            <div className="question-list">
              {history.map((h) => (
                <div key={h.id} className="weak-topic-item">
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-md)', background: h.focus_score > 70 ? 'rgba(0,180,80,0.10)' : h.focus_score > 40 ? 'rgba(255,160,0,0.10)' : 'rgba(255,20,60,0.10)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: h.focus_score > 70 ? '#00e676' : h.focus_score > 40 ? '#ffab00' : '#ff4060' }}>
                    {h.focus_score}%
                  </div>
                  <div className="flex-1">
                    <div className="font-700">Day {h.day_number} Session</div>
                    <div className="text-sm text-tertiary">Focused: {formatDuration(h.focused_seconds)} | Distracted: {formatDuration(h.distracted_seconds)} | Away: {formatDuration(h.away_seconds)}</div>
                  </div>
                  <div className="text-sm text-tertiary">{new Date(h.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Brain size={32} className="empty-state-icon" />
              <div className="empty-state-text">No focus sessions recorded yet</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
