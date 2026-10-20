/// <reference lib="webworker" />
import { env, pipeline } from '@huggingface/transformers'
import ortMjsUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url'
import ortWasmUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url'

/**
 * Runs Whisper (tiny, quantized) fully inside the browser. Audio never leaves the device.
 * The ONNX runtime (JS + WASM) is served from this app's own origin, NOT a CDN. Only the model weights are
 * downloaded (once, from huggingface.co) and cached by the browser.
 */
env.allowLocalModels = false
const wasm = env.backends.onnx.wasm
if (wasm) {
  wasm.wasmPaths = { mjs: ortMjsUrl, wasm: ortWasmUrl }
  wasm.numThreads = 1 // avoids needing cross-origin isolation (SharedArrayBuffer)
  wasm.proxy = false
}

export const MODEL_ID = 'Xenova/whisper-tiny'

export type WorkerRequest = { type: 'load' } | { type: 'transcribe'; id: number; audio: Float32Array }
export type WorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'ready' }
  | { type: 'result'; id: number; text: string }
  | { type: 'error'; id?: number; stage: 'load' | 'transcribe' }

type Transcriber = (audio: Float32Array, options?: Record<string, unknown>) => Promise<{ text: string } | { text: string }[]>
let transcriber: Promise<Transcriber> | null = null

function load(): Promise<Transcriber> {
  transcriber ??= (async () => {
    const files = new Map<string, { loaded: number; total: number }>()
    const t = await pipeline('automatic-speech-recognition', MODEL_ID, {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: (p: { status?: string; file?: string; loaded?: number; total?: number }) => {
        if (p.status !== 'progress' || !p.file || !p.total) return
        files.set(p.file, { loaded: p.loaded ?? 0, total: p.total })
        let loaded = 0
        let total = 0
        files.forEach((f) => { loaded += f.loaded; total += f.total })
        postMessage({ type: 'progress', percent: Math.min(99, Math.round((loaded / total) * 100)) } satisfies WorkerResponse)
      },
    })
    return t as unknown as Transcriber
  })()
  transcriber.catch(() => { transcriber = null }) // allow a retry after a failed download
  return transcriber
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (msg.type === 'load') {
    try { await load(); postMessage({ type: 'ready' } satisfies WorkerResponse) }
    catch { postMessage({ type: 'error', stage: 'load' } satisfies WorkerResponse) }
  } else if (msg.type === 'transcribe') {
    try {
      const run = await load()
      const out = await run(msg.audio, { chunk_length_s: 30, task: 'transcribe' })
      const text = (Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text).trim()
      postMessage({ type: 'result', id: msg.id, text } satisfies WorkerResponse)
    } catch {
      postMessage({ type: 'error', id: msg.id, stage: 'transcribe' } satisfies WorkerResponse)
    }
  }
}
