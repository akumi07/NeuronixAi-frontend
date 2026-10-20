import { AudioLines, Loader2, Mic, Square } from 'lucide-react'
import type { VoiceApi } from '../../../lib/useVoiceInput'

export function VoiceButton({ voice, disabled }: { voice: VoiceApi; disabled: boolean }) {
  if (!voice.supported) return null
  const active = voice.state === 'listening' || voice.state === 'recording'
  const busy = voice.state === 'transcribing'
  return (
    <button
      type="button"
      disabled={disabled || busy || voice.state === 'consent'}
      onClick={active ? voice.stop : () => voice.start(voice.currentText)}
      aria-pressed={active}
      aria-label={active ? 'Stop voice input' : 'Start voice input'}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${active ? 'border-coral bg-coral/10 text-[#B8321F]' : 'border-line text-muted hover:border-violet/40 hover:text-violet'}`}
    >
      {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : active ? <Square size={14} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
      {busy ? 'Transcribing…' : active ? 'Stop' : 'Voice'}
    </button>
  )
}

/** Status, consent and error messages for voice input. Rendered under the text box. */
export function VoiceStatus({ voice }: { voice: VoiceApi }) {
  const pct = voice.progress !== null ? ` (${voice.progress}%)` : ''
  return (
    <div aria-live="polite" className="space-y-2 px-4 pb-2 text-xs text-muted">
      {voice.state === 'listening' && (
        <p role="status"><span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-coral align-middle" aria-hidden="true" />Listening. Your words appear above and you can edit them before sending. This browser’s speech service may send audio to its provider.</p>
      )}
      {voice.state === 'recording' && (
        <p role="status"><span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-coral align-middle" aria-hidden="true" />Recording. Speak, then press Stop. Transcription happens on this device, so your audio isn’t sent anywhere.{voice.progress !== null && ` Preparing the speech model${pct}…`}</p>
      )}
      {voice.state === 'transcribing' && (
        <p role="status"><AudioLines size={13} className="mr-1.5 inline align-text-bottom" aria-hidden="true" />Transcribing on this device{voice.progress !== null ? `. Downloading the speech model${pct}…` : '…'}</p>
      )}
      {voice.state === 'consent' && (
        <div role="alertdialog" aria-label="Download speech model" className="rounded-2xl border border-line bg-canvas p-4 text-sm text-ink">
          <p className="font-semibold">Voice typing needs a one-time download</p>
          <p className="mt-1 text-muted">To work in every browser, NeuronixAI can transcribe on your device with a small speech model (about 40 MB, downloaded from Hugging Face and cached by your browser). Your audio never leaves this device.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={voice.confirmDownload} className="rounded-lg bg-violet px-3 py-1.5 text-sm font-semibold text-white">Download and use</button>
            <button type="button" onClick={voice.cancelConsent} className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold">Not now</button>
          </div>
        </div>
      )}
      {voice.error && <p role="alert" className="text-[#9E2B1B]">{voice.error}</p>}
      {voice.fallbackOffered && (
        <button type="button" onClick={voice.useOnDevice} className="rounded-lg border border-violet/40 px-3 py-1.5 text-sm font-semibold text-violet hover:bg-violet/5">Use on-device voice instead</button>
      )}
    </div>
  )
}
