import { useId } from 'react'

/** NeuronixAI mark: an "N" drawn as a path between three connected nodes. */
export function BrandMark({ size = 36 }: { size?: number }) {
  const gid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7047EB" />
          <stop offset="1" stopColor="#3685F5" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="11" fill={`url(#${gid})`} />
      <path d="M11 26V10l14 16V10" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="10" r="3" fill="#fff" />
      <circle cx="25" cy="26" r="3" fill="#fff" />
      <circle cx="25" cy="10" r="3" fill="#20C9D7" stroke="#fff" strokeWidth="1.6" />
    </svg>
  )
}

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark />
      <span className="font-display text-[1.2rem] font-bold tracking-tight text-ink">
        Neuronix<span className="text-violet">AI</span>
      </span>
    </span>
  )
}
