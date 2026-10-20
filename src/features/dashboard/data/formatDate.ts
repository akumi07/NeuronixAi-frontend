const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/**
 * The API returns LocalDateTime without a zone. We assume UTC (server default) and show day-level
 * precision only, so an offset error can't produce misleading "5 minutes ago" claims.
 */
export function formatDay(iso: string): string {
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000)
  if (days <= 7) return rtf.format(-days, 'day').replace(/^./, (c) => c.toUpperCase())
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: days > 300 ? 'numeric' : undefined })
}
