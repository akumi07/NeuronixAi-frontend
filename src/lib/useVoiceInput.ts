import { useCallback, useEffect, useRef, useState } from 'react'
import { setPreferences, usePreferences } from '../features/settings/preferences'
import { appendSpoken, assembleTranscript, describeSpeechError, getSpeechRecognition, type SpeechRecognitionLike } from './speech'
import { loadModel, transcribe } from './onDeviceSpeech/client'
import { MicrophoneError, startRecording, type Recording } from './onDeviceSpeech/recorder'

export type VoiceState = 'idle' | 'listening' | 'consent' | 'recording' | 'transcribing'

interface Options { onText: (text: string) => void; maxLength: number; currentText: string }

const NETWORK_LIKE = new Set(['network', 'service-not-allowed', 'language-not-supported'])

/**
 * Voice typing that works in any modern browser and never sends anything to NeuronixAI's backend.
 *  1. If the browser has a working speech service (Chrome/Edge/Safari), use it (live text; the vendor's service hears the audio).
 *  2. Otherwise (Brave, Firefox, blocked service) offer on-device Whisper: a one-time model download, then audio is
 *     transcribed entirely on this device. The text only goes into the editable box; the user presses send.
 */
export function useVoiceInput({ onText, maxLength, currentText }: Options) {
  const Native = getSpeechRecognition()
  const { onDeviceVoice } = usePreferences()
  const onDeviceSupported = typeof MediaRecorder !== 'undefined' && typeof Worker !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const [state, setState] = useState<VoiceState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [fallbackOffered, setFallbackOffered] = useState(false)

  const onTextRef = useRef(onText)
  useEffect(() => { onTextRef.current = onText }, [onText])
  const native = useRef<SpeechRecognitionLike | null>(null)
  const recording = useRef<Recording | null>(null)
  const model = useRef<Promise<void> | null>(null)
  const baseline = useRef('')

  useEffect(() => () => { native.current?.abort(); recording.current?.cancel() }, [])

  /** Stops recording, waits for the model, transcribes on-device, and appends the text to the box. */
  const finishOnDevice = useCallback(async () => {
    const rec = recording.current
    recording.current = null
    if (!rec) return
    setState('transcribing')
    const audio = await rec.stop()
    if (!audio) { setState('idle'); setError('No audio was captured. Try again.'); return }
    try {
      await model.current
      const text = await transcribe(audio)
      if (text) onTextRef.current(appendSpoken(baseline.current, text, maxLength))
      else setError('No speech was recognised. Try again.')
    } catch (e) {
      setError((e as Error).message === 'load'
        ? 'Couldn’t download the speech model. Check your connection and try again.'
        : 'Couldn’t transcribe that recording. Try again.')
    } finally {
      setState('idle'); setProgress(null)
    }
  }, [maxLength])

  const startOnDevice = useCallback(async (base: string) => {
    baseline.current = base
    setError(null); setFallbackOffered(false); setProgress(null)
    try {
      recording.current = await startRecording(() => { void finishOnDevice() })
    } catch (e) {
      setState('idle')
      const reason = e instanceof MicrophoneError ? e.reason : 'unavailable'
      setError(reason === 'denied' ? describeSpeechError('not-allowed') : reason === 'unsupported' ? 'This browser can’t record audio.' : describeSpeechError('audio-capture'))
      return
    }
    setState('recording')
    // Download the model while the user is speaking.
    model.current = loadModel((p) => setProgress(p))
    model.current.catch(() => { /* reported when transcription is attempted */ })
  }, [finishOnDevice])

  const startNative = useCallback((base: string) => {
    if (!Native || native.current) return
    setError(null); setFallbackOffered(false)
    const r = new Native()
    r.lang = navigator.language || 'en-US'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => onTextRef.current(assembleTranscript(base, e.results, maxLength))
    r.onerror = (e) => {
      setError(describeSpeechError(e.error))
      if (NETWORK_LIKE.has(e.error) && onDeviceSupported) setFallbackOffered(true)
    }
    r.onend = () => { native.current = null; setState('idle') }
    native.current = r
    try { r.start(); setState('listening') } catch { native.current = null; setError(describeSpeechError('unknown')) }
  }, [Native, maxLength, onDeviceSupported])

  /** `base` is the text already in the box; the spoken words are appended to it. */
  const start = useCallback((base: string) => {
    baseline.current = base
    if (Native) startNative(base)
    else if (onDeviceVoice) void startOnDevice(base)
    else setState('consent')
  }, [Native, onDeviceVoice, startNative, startOnDevice])

  const useOnDevice = useCallback(() => {
    if (onDeviceVoice) void startOnDevice(baseline.current)
    else { setError(null); setFallbackOffered(false); setState('consent') }
  }, [onDeviceVoice, startOnDevice])

  const confirmDownload = useCallback(() => { setPreferences({ onDeviceVoice: true }); void startOnDevice(baseline.current) }, [startOnDevice])
  const cancelConsent = useCallback(() => setState('idle'), [])

  const stop = useCallback(() => {
    if (native.current) native.current.stop()
    else void finishOnDevice()
  }, [finishOnDevice])

  return {
    supported: Native !== null || onDeviceSupported,
    state, error, progress, fallbackOffered, currentText,
    start, stop, useOnDevice, confirmDownload, cancelConsent,
  }
}
export type VoiceApi = ReturnType<typeof useVoiceInput>
