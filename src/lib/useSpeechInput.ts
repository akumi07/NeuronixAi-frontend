import { useCallback, useEffect, useRef, useState } from 'react'
import { assembleTranscript, describeSpeechError, getSpeechRecognition, type SpeechRecognitionLike } from './speech'

interface Options {
  onText: (text: string) => void
  maxLength: number
}

/**
 * Voice typing via the browser's Web Speech API. Nothing is sent to NeuronixAI until the user presses send:
 * speech is only transcribed into the editable text box. The browser vendor's speech service performs the
 * recognition (in Chrome, audio is sent to Google), and nothing is recorded or stored by this app.
 */
export function useSpeechInput({ onText, maxLength }: Options) {
  const Ctor = getSpeechRecognition()
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rec = useRef<SpeechRecognitionLike | null>(null)
  const onTextRef = useRef(onText)
  useEffect(() => { onTextRef.current = onText }, [onText])

  useEffect(() => () => rec.current?.abort(), [])

  const stop = useCallback(() => rec.current?.stop(), [])

  /** `baseline` is the text already in the box; speech is appended to it. */
  const start = useCallback((baseline: string) => {
    if (!Ctor || rec.current) return
    setError(null)
    const r = new Ctor()
    r.lang = navigator.language || 'en-US'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => onTextRef.current(assembleTranscript(baseline, e.results, maxLength))
    r.onerror = (e) => setError(describeSpeechError(e.error))
    r.onend = () => { rec.current = null; setListening(false) }
    rec.current = r
    try {
      r.start()
      setListening(true)
    } catch {
      rec.current = null
      setError(describeSpeechError('unknown'))
    }
  }, [Ctor, maxLength])

  return { supported: Ctor !== null, listening, error, start, stop, clearError: () => setError(null) }
}
