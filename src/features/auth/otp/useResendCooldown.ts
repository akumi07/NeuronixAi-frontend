import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Countdown for the "Resend code" button. This is a usability throttle only: the backend must enforce resend cooldowns,
 * expiry, single use, and attempt limits. When the backend supplies `resendAvailableInSeconds` it is used instead of the default.
 */
export function useResendCooldown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const deadline = useRef<number | null>(null)

  useEffect(() => {
    deadline.current = Date.now() + initialSeconds * 1000
    const id = window.setInterval(() => setSecondsLeft(Math.max(0, Math.ceil(((deadline.current ?? 0) - Date.now()) / 1000))), 500)
    return () => window.clearInterval(id)
  }, [initialSeconds])

  const restart = useCallback((seconds: number) => {
    deadline.current = Date.now() + seconds * 1000
    setSecondsLeft(seconds)
  }, [])

  return { secondsLeft, restart }
}
