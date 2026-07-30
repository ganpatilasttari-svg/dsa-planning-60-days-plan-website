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
      background: '#141828',
      borderColor: 'rgba(255,255,255,0.12)',
      color: '#fbbf24',
      boxShadow: 'none',
    } : {
      background: '#141828',
      borderColor: 'rgba(255,255,255,0.12)',
      color: '#818cf8',
      boxShadow: 'none',
    }}>
      {isDay ? <Sun size={16} /> : <Moon size={16} />}
    </div>
  )
}
