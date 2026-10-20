import type { RefObject } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'
import { useVoiceInput } from '../../../lib/useVoiceInput'
import { VoiceButton, VoiceStatus } from './VoiceControls'
import type { Failure } from '../api/failures'
import { ErrorNotice } from './StateViews'

export const MAX_MESSAGE_LENGTH = 4000

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  sending: boolean
  failure: Failure | null
  textareaRef: RefObject<HTMLTextAreaElement | null>
  placeholder?: string
  submitLabel?: string
}

export function TaskComposer({ value, onChange, onSubmit, sending, failure, textareaRef, placeholder, submitLabel = 'Start task' }: Props) {
  const canSend = value.trim().length > 0 && !sending
  const voice = useVoiceInput({ onText: onChange, maxLength: MAX_MESSAGE_LENGTH, currentText: value })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) onSubmit()
      }}
      className="rounded-3xl border border-line bg-white p-2 shadow-lift transition focus-within:border-violet/50 focus-within:ring-4 focus-within:ring-violet/10"
    >
      <label htmlFor="task-input" className="sr-only">Describe your goal</label>
      <textarea
        id="task-input"
        ref={textareaRef}
        rows={3}
        value={value}
        maxLength={MAX_MESSAGE_LENGTH}
        disabled={sending}
        placeholder={placeholder ?? 'Describe what you want to get done…'}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSend) {
            e.preventDefault()
            onSubmit()
          }
        }}
        className="block w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-[1rem] leading-relaxed outline-none placeholder:text-muted/60 disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-1">
        <p className="text-xs text-muted">
          <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">Ctrl</kbd> + <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">Enter</kbd> to send
          {value.length > MAX_MESSAGE_LENGTH - 400 && <span className="ml-2">{value.length}/{MAX_MESSAGE_LENGTH}</span>}
        </p>
        <div className="flex items-center gap-2">
        <VoiceButton voice={voice} disabled={sending} />
        <button
          type="submit"
          disabled={!canSend}
          aria-busy={sending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(112_71_235/0.7)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
          {sending ? 'Working…' : submitLabel}
        </button>
        </div>
      </div>
      <VoiceStatus voice={voice} />
      {failure && (
        <div className="px-2 pb-2">
          <ErrorNotice failure={failure} />
          {failure.title === 'That took too long' && (
            <p className="mt-2 px-1 text-xs text-muted">The request may still have been saved. Check Recent work before sending again.</p>
          )}
        </div>
      )}
    </form>
  )
}
