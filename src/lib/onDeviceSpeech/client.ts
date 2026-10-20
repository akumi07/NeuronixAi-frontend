import type { WorkerRequest, WorkerResponse } from './whisperWorker'

/** Thin main-thread wrapper around the Whisper worker. The worker (and the model) is created lazily on first use. */
let worker: Worker | null = null
let nextId = 1
let ready: Promise<void> | null = null
const progressListeners = new Set<(percent: number) => void>()
const pending = new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>()
let loadWaiter: { resolve: () => void; reject: (e: Error) => void } | null = null

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./whisperWorker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const m = e.data
    if (m.type === 'progress') progressListeners.forEach((l) => l(m.percent))
    else if (m.type === 'ready') loadWaiter?.resolve()
    else if (m.type === 'result') { pending.get(m.id)?.resolve(m.text); pending.delete(m.id) }
    else if (m.type === 'error') {
      if (m.stage === 'load') { loadWaiter?.reject(new Error('load')); loadWaiter = null; ready = null }
      else if (m.id !== undefined) { pending.get(m.id)?.reject(new Error('transcribe')); pending.delete(m.id) }
    }
  }
  worker.onerror = () => {
    loadWaiter?.reject(new Error('load'))
    pending.forEach((p) => p.reject(new Error('transcribe')))
    pending.clear()
    worker?.terminate(); worker = null; ready = null
  }
  return worker
}

/** Starts (or joins) the model download. Resolves when the model is ready; rejects if the download fails. */
export function loadModel(onProgress?: (percent: number) => void): Promise<void> {
  if (onProgress) {
    progressListeners.add(onProgress)
  }
  ready ??= new Promise<void>((resolve, reject) => {
    loadWaiter = { resolve, reject }
    getWorker().postMessage({ type: 'load' } satisfies WorkerRequest)
  })
  const done = ready
  const cleanup = () => { if (onProgress) progressListeners.delete(onProgress) }
  done.then(cleanup, cleanup)
  return done
}

export function transcribe(audio: Float32Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ type: 'transcribe', id, audio } satisfies WorkerRequest, [audio.buffer])
  })
}
