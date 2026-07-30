import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, GripVertical } from 'lucide-react'
import { useCamera } from './CameraContext'

export default function FloatingCamera() {
  const { stream, enabled, recording, error, startCamera, stopCamera } = useCamera()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [pos, setPos] = useState({ x: 24, y: window.innerHeight - 180 })
  const [dragging, setDragging] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const dragRef = useRef<{ ox: number; oy: number } | null>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream, enabled])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const nx = e.clientX - dragRef.current.ox
      const ny = e.clientY - dragRef.current.oy
      const maxX = window.innerWidth - 120
      const maxY = window.innerHeight - 120
      setPos({ x: Math.max(8, Math.min(maxX, nx)), y: Math.max(8, Math.min(maxY, ny)) })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  if (recording) return null
  if (!enabled && !error) return null

  const startDrag = (e: React.MouseEvent) => {
    e.stopPropagation()
    dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y }
    setDragging(true)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 9000,
        width: 120,
        height: 120,
        borderRadius: '50%',
        overflow: 'visible',
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        style={{
          position: 'absolute',
          top: -2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 36,
          height: 18,
          borderRadius: '9px 9px 0 0',
          background: 'rgba(2,3,10,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          zIndex: 2,
        }}
      >
        <GripVertical size={12} color="rgba(255,255,255,0.5)" />
      </div>

      {/* Camera circle */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid rgba(99,149,255,0.22)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          background: 'rgba(6,9,22,0.75)',
          backdropFilter: 'blur(24px) saturate(160%)',
          position: 'relative',
        }}
      >
        {enabled && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
            <CameraOff size={22} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textAlign: 'center', padding: '0 8px' }}>
              {error ? 'No Access' : 'Camera Off'}
            </span>
          </div>
        )}

        {/* Live indicator */}
        {enabled && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#e8e8e8',
            boxShadow: '0 0 8px rgba(255,255,255,0.40)',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div style={{
          position: 'absolute',
          bottom: -44,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 6,
          animation: 'fadeIn 200ms ease-out',
        }}>
          {enabled ? (
            <button
              onClick={(e) => { e.stopPropagation(); stopCamera() }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#808080',
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(14px)',
              }}
            >
              <CameraOff size={11} /> Turn Off
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); startCamera() }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.20)',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(14px)',
              }}
            >
              <Camera size={11} /> Enable
            </button>
          )}
        </div>
      )}
    </div>
  )
}
