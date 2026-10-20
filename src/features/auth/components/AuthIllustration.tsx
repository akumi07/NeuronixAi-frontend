import { motion } from 'motion/react'
import { AGENTS } from '../../landing/data/landingContent'

const POS = [
  { x: 60, y: 70 }, { x: 250, y: 40 }, { x: 330, y: 170 },
  { x: 270, y: 300 }, { x: 80, y: 290 }, { x: 30, y: 180 },
]

/** Decorative constellation: six agent nodes around a central goal node. Purely illustrative. */
export function AuthIllustration() {
  return (
    <svg viewBox="0 0 380 360" className="w-full max-w-md" role="img" aria-label="Illustration of specialized agents connected around a single goal">
      <g strokeWidth="1.6" fill="none">
        {AGENTS.map((a, i) => (
          <line key={a.id} x1="190" y1="170" x2={POS[i].x + 24} y2={POS[i].y + 24} stroke={a.color} strokeOpacity="0.45" strokeDasharray="4 7" className="flow-line" />
        ))}
      </g>
      <circle cx="190" cy="170" r="44" fill="url(#hub)" />
      <circle cx="190" cy="170" r="58" fill="none" stroke="#7047EB" strokeOpacity="0.18" />
      <defs>
        <linearGradient id="hub" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7047EB" /><stop offset="1" stopColor="#3685F5" /></linearGradient>
      </defs>
      <text x="190" y="175" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Your goal</text>
      {AGENTS.map((a, i) => {
        const Icon = a.icon
        return (
          <motion.g key={a.id} animate={{ y: [0, -5, 0] }} transition={{ duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}>
            <rect x={POS[i].x} y={POS[i].y} width="48" height="48" rx="14" fill="#fff" stroke={a.color} strokeOpacity="0.5" />
            <foreignObject x={POS[i].x + 12} y={POS[i].y + 12} width="24" height="24">
              <Icon size={24} color={a.color} aria-hidden="true" />
            </foreignObject>
          </motion.g>
        )
      })}
    </svg>
  )
}
