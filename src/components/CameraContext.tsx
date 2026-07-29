import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'

interface CameraState {
  stream: MediaStream | null
  enabled: boolean
  recording: boolean
  error: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  startRecording: () => MediaRecorder | null
  stopRecording: () => void
  recorderRef: React.MutableRefObject<MediaRecorder | null>
  chunksRef: React.MutableRefObject<Blob[]>
}

const CameraContext = createContext<CameraState | null>(null)

export function useCamera() {
  const ctx = useContext(CameraContext)
  if (!ctx) throw new Error('useCamera must be used within CameraProvider')
  return ctx
}

export function CameraProvider({ children }: { children: ReactNode }) {
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [enabled, setEnabled] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      if (streamRef.current) return
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      })
      streamRef.current = stream
      setEnabled(true)
    } catch {
      setError('Could not access camera. Please grant camera permission in your browser.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setEnabled(false)
    setRecording(false)
  }, [])

  const startRecording = useCallback((): MediaRecorder | null => {
    if (!streamRef.current) return null
    chunksRef.current = []
    const mimeOptions = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ]
    let mimeType = ''
    for (const m of mimeOptions) {
      if (MediaRecorder.isTypeSupported(m)) { mimeType = m; break }
    }
    const rec = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current)
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    rec.start(1000)
    recorderRef.current = rec
    setRecording(true)
    return rec
  }, [])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setRecording(false)
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

  return (
    <CameraContext.Provider value={{
      stream: streamRef.current,
      enabled,
      recording,
      error,
      startCamera,
      stopCamera,
      startRecording,
      stopRecording,
      recorderRef,
      chunksRef,
    }}>
      {children}
    </CameraContext.Provider>
  )
}
