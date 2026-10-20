/** Records microphone audio and returns 16 kHz mono PCM for Whisper. Nothing is stored or uploaded. */
export const MAX_RECORDING_MS = 60_000

export interface Recording {
  /** Stops recording and resolves with the decoded audio (or null if nothing usable was captured). */
  stop: () => Promise<Float32Array | null>
  /** Abandons the recording without producing audio. */
  cancel: () => void
}

export class MicrophoneError extends Error {
  readonly reason: 'denied' | 'unavailable' | 'unsupported'
  constructor(reason: 'denied' | 'unavailable' | 'unsupported') { super(reason); this.reason = reason }
}

export async function startRecording(onAutoStop: () => void): Promise<Recording> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new MicrophoneError('unsupported')
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
  } catch (e) {
    const name = e instanceof DOMException ? e.name : ''
    throw new MicrophoneError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable')
  }

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(stream)
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
  const release = () => stream.getTracks().forEach((t) => t.stop()) // turns the microphone indicator off
  const timer = window.setTimeout(onAutoStop, MAX_RECORDING_MS)
  recorder.start()

  const finished = new Promise<void>((resolve) => { recorder.onstop = () => resolve() })

  return {
    stop: async () => {
      window.clearTimeout(timer)
      if (recorder.state !== 'inactive') recorder.stop()
      await finished
      release()
      if (chunks.length === 0) return null
      const blob = new Blob(chunks, { type: recorder.mimeType })
      const ctx = new AudioContext({ sampleRate: 16_000 })
      try {
        const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
        return decoded.getChannelData(0).slice()
      } catch {
        return null
      } finally {
        void ctx.close()
      }
    },
    cancel: () => {
      window.clearTimeout(timer)
      recorder.ondataavailable = null
      if (recorder.state !== 'inactive') recorder.stop()
      release()
    },
  }
}
