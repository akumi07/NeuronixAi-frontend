import { describe, expect, it } from 'vitest'
import { daysAgo, secondsBetween } from './formatDate'

describe('date helpers', () => {
  it('computes zone-independent deltas from zoneless API timestamps', () => {
    expect(secondsBetween('2026-10-20T08:00:00', '2026-10-20T08:00:07')).toBe(7)
  })
  it('returns null for negative or invalid deltas', () => {
    expect(secondsBetween('2026-10-20T08:00:07', '2026-10-20T08:00:00')).toBeNull()
    expect(secondsBetween('nope', 'also nope')).toBeNull()
  })
  it('treats invalid dates as infinitely old', () => expect(daysAgo('nope')).toBe(Infinity))
})
