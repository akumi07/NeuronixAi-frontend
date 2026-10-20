/** Minimal typings for the Web Speech API (not in lib.dom). */
export interface SpeechAlternativeLike { transcript: string }
export interface SpeechResultLike { isFinal: boolean; 0: SpeechAlternativeLike }
export interface SpeechResultListLike { length: number; [index: number]: SpeechResultLike }

export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { results: SpeechResultListLike }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
export type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Joins the text that was already in the box with the (final + interim) transcript, without doubling spaces. */
export function appendSpoken(baseline: string, spokenText: string, maxLength: number): string {
  const spoken = spokenText.replace(/\s+/g, ' ').trim()
  const sep = baseline && !/\s$/.test(baseline) && spoken ? ' ' : ''
  return (baseline + sep + spoken).slice(0, maxLength)
}

export function assembleTranscript(baseline: string, results: SpeechResultListLike, maxLength: number): string {
  let spoken = ''
  for (let i = 0; i < results.length; i++) spoken += results[i][0].transcript
  return appendSpoken(baseline, spoken, maxLength)
}

export function describeSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed': return 'Microphone access was blocked. Allow it in your browser’s site settings to use voice.'
    case 'audio-capture': return 'No microphone was found.'
    case 'no-speech': return 'No speech was heard. Try again.'
    case 'network': return 'The browser’s speech service couldn’t be reached. Some browsers (such as Brave) turn it off. Try Chrome, Edge or Safari.'
    case 'language-not-supported': return 'Your language isn’t supported for voice input in this browser.'
    default: return 'Voice input stopped unexpectedly.'
  }
}
