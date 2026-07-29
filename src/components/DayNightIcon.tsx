import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

function useIsDaytime() {
  const [isDay, setIsDay] = useState(true)
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const istOffset = 5.5 * 60 * 60 * 1000
      const ist = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000))
      const h = ist.getUTCHours()
      setIsDay(h >= 6 && h < 18)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])
  return isDay
}

export default function DayNightIcon() {
  const isDay = useIsDaytime()
  return (
    <div className="day-night-icon" title={isDay ? 'Daytime' : 'Nighttime'} style={isDay ? {
      background: 'linear-gradient(135deg, rgba(255,184,0,0.2), rgba(255,107,0,0.12))',
      borderColor: 'rgba(255,184,0,0.4)',
      color: 'var(--amber-bright)',
      boxShadow: '0 0 16px rgba(255,184,0,0.3)',
    } : {
      background: 'linear-gradient(135deg, rgba(91,77,255,0.15), rgba(0,229,255,0.08))',
      borderColor: 'rgba(124,109,255,0.4)',
      color: 'var(--indigo-bright)',
      boxShadow: '0 0 16px rgba(91,77,255,0.25)',
    }}>
      {isDay ? <Sun size={16} /> : <Moon size={16} />}
    </div>
  )
}
