import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDownToLine, GitBranch, Target } from 'lucide-react'
import { AGENTS, AGENT_BY_ID, WORKFLOW_EXAMPLES, type Agent } from '../data/landingContent'

const STAGE_W = 600
const STAGE_H = 680
const CARD_W = 200
const CARD_H = 68
const ROW_Y = [270, 360, 450]
const RESULT = { x: 160, y: 590, w: 280, h: 64 }
const ROUTER = { cx: 300, y: 165, w: 176, h: 50 }

const LEFT = AGENTS.slice(0, 3)
const RIGHT = AGENTS.slice(3)

interface Node {
  agent: Agent
  x: number
  y: number
  side: 'left' | 'right'
  row: number
}

const NODES: Node[] = [
  ...LEFT.map((agent, row): Node => ({ agent, x: 0, y: ROW_Y[row], side: 'left', row })),
  ...RIGHT.map((agent, row): Node => ({ agent, x: STAGE_W - CARD_W, y: ROW_Y[row], side: 'right', row })),
]

function routerPath(n: Node) {
  const ty = n.y + CARD_H / 2
  const ex = n.side === 'left' ? CARD_W : STAGE_W - CARD_W
  const mid = n.side === 'left' ? ex + 60 : ex - 60
  return `M${ROUTER.cx},${ROUTER.y + ROUTER.h} C${ROUTER.cx},${ty} ${mid},${ty} ${ex},${ty}`
}

function resultPath(n: Node) {
  const ty = n.y + CARD_H / 2
  const dir = n.side === 'left' ? 1 : -1
  const ex = n.side === 'left' ? CARD_W : STAGE_W - CARD_W
  const endX = 300 + dir * -(55 - n.row * 25)
  return `M${ex},${ty} C${ex + dir * 34},${ty} ${endX},${RESULT.y - 50} ${endX},${RESULT.y}`
}

/**
 * Signature conceptual graphic: a goal flows through a routing layer to specialist agents
 * and into a consolidated result. It cycles through the illustrative examples and is
 * explicitly labelled as not being a live execution.
 */
export function AgentOrchestrationVisual() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const scenario = WORKFLOW_EXAMPLES[index]
  const active = new Set<string>(scenario.steps)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (paused || reduced) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % WORKFLOW_EXAMPLES.length), 5000)
    return () => window.clearInterval(t)
  }, [paused, reduced])

  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setScale(Math.min(1, el.clientWidth / STAGE_W))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <figure
      className="relative mx-auto w-full max-w-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <figcaption className="sr-only">
        Illustrative diagram: a user goal passes through a routing layer to specialist agents, then to a consolidated result.
        Currently showing the example “{scenario.request}” routed to{' '}
        {scenario.steps.map((s) => AGENT_BY_ID[s].name).join(' and ')}.
      </figcaption>

      {/* Desktop / tablet map */}
      <div ref={wrapRef} className="hidden min-[560px]:block" style={{ height: STAGE_H * scale }} aria-hidden="true">
        <div className="relative origin-top-left" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
          <svg className="absolute inset-0" width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} fill="none">
            <path d={`M300,76 L300,${ROUTER.y}`} stroke="#7047EB" strokeWidth="2" className="flow-line" />
            {NODES.map((n) => {
              const on = active.has(n.agent.id)
              return (
                <g key={n.agent.id} style={{ transition: 'opacity .4s' }}>
                  <path d={routerPath(n)} stroke={on ? n.agent.color : '#DADDEE'} strokeWidth={on ? 2.25 : 1.5} className={on ? 'flow-line' : ''} />
                  <path d={resultPath(n)} stroke={on ? n.agent.color : '#E6E8F3'} strokeWidth={on ? 2.25 : 1.25} opacity={on ? 0.85 : 1} />
                </g>
              )
            })}
          </svg>

          {/* Goal */}
          <div
            className="absolute left-[150px] top-0 flex h-[76px] w-[300px] items-center gap-3 rounded-2xl border border-line bg-white px-4 shadow-soft"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet"><Target size={18} /></span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Example goal</span>
              <span className="block text-[13px] font-semibold leading-snug text-ink">{scenario.request}</span>
            </span>
          </div>

          {/* Routing layer */}
          <div
            className="absolute flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet to-blue text-[13px] font-semibold text-white shadow-lift"
            style={{ left: ROUTER.cx - ROUTER.w / 2, top: ROUTER.y, width: ROUTER.w, height: ROUTER.h }}
          >
            <GitBranch size={16} /> Routing layer
          </div>

          {/* Specialists */}
          {NODES.map((n) => {
            const on = active.has(n.agent.id)
            const Icon = n.agent.icon
            return (
              <div
                key={n.agent.id}
                className="absolute flex items-center gap-3 rounded-2xl border bg-white px-3.5 transition-all duration-500"
                style={{
                  left: n.x,
                  top: n.y,
                  width: CARD_W,
                  height: CARD_H,
                  borderColor: on ? n.agent.color : '#E8EAF5',
                  boxShadow: on ? `0 16px 32px -14px ${n.agent.color}88` : '0 1px 2px rgb(32 33 58 / 0.04)',
                  opacity: on ? 1 : 0.62,
                  transform: on ? 'translateY(-2px)' : 'none',
                }}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `${n.agent.color}1F`, color: n.agent.color }}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold leading-tight text-ink">{n.agent.name}</span>
                  <span className="block text-[11.5px] text-muted">{n.agent.short}</span>
                </span>
              </div>
            )
          })}

          {/* Result */}
          <div
            className="absolute flex items-center gap-3 rounded-2xl border border-line bg-gradient-to-br from-white to-[#EEF0FF] px-5 shadow-soft"
            style={{ left: RESULT.x, top: RESULT.y, width: RESULT.w, height: RESULT.h }}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-mint/20 text-[#1E9E6E]"><ArrowDownToLine size={18} /></span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Consolidated result</span>
              <span className="block text-[14px] font-semibold text-ink">{scenario.outcome}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Small-screen stacked version */}
      <div className="min-[560px]:hidden" aria-hidden="true">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Example goal</p>
          <p className="mt-1 text-sm font-semibold">{scenario.request}</p>
        </div>
        <div className="mx-auto h-5 w-px bg-violet/40" />
        <div className="mx-auto w-fit rounded-full bg-gradient-to-r from-violet to-blue px-4 py-2 text-xs font-semibold text-white">Routing layer</div>
        <div className="mx-auto h-5 w-px bg-violet/40" />
        <div className="grid grid-cols-2 gap-2.5">
          {AGENTS.map((a) => {
            const on = active.has(a.id)
            const Icon = a.icon
            return (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-xl border bg-white p-2.5 transition-all"
                style={{ borderColor: on ? a.color : '#E8EAF5', opacity: on ? 1 : 0.6 }}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `${a.color}1F`, color: a.color }}>
                  <Icon size={16} />
                </span>
                <span className="text-xs font-semibold leading-tight">{a.name}</span>
              </div>
            )
          })}
        </div>
        <div className="mx-auto h-5 w-px bg-violet/40" />
        <div className="rounded-2xl border border-line bg-gradient-to-br from-white to-[#EEF0FF] p-4 text-center shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Consolidated result</p>
          <p className="mt-1 text-sm font-semibold">{scenario.outcome}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {WORKFLOW_EXAMPLES.map((w, i) => (
          <button
            key={w.id}
            type="button"
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              i === index ? 'border-violet bg-violet text-white' : 'border-line bg-white text-muted hover:border-violet/40 hover:text-violet'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">Illustrative orchestration concept — not a live execution.</p>
    </figure>
  )
}
