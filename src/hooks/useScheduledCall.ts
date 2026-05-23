import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useScheduledCallStore } from '../store/scheduledCallStore'

export function useScheduledCall() {
  const navigate = useNavigate()
  const location = useLocation()
  const { scheduledTime, scheduledDays, isEnabled, lastCallDate, markCallMade } =
    useScheduledCallStore()

  useEffect(() => {
    if (!isEnabled) return

    const check = () => {
      if (location.pathname.startsWith('/parent/interview')) return

      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const today = now.toISOString().split('T')[0]

      if (
        currentTime === scheduledTime &&
        scheduledDays.includes(now.getDay()) &&
        lastCallDate !== today
      ) {
        markCallMade()
        navigate('/parent/interview?type=scheduled')
      }
    }

    check()
    const id = setInterval(check, 60 * 1000)
    return () => clearInterval(id)
  }, [isEnabled, scheduledTime, scheduledDays, lastCallDate, location.pathname])
}
