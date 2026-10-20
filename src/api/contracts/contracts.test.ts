import { describe, expect, it } from 'vitest'
import { registerResponse, verifyResetOtpResponse } from './auth'
import { documentPhase, documentRecord } from './documents'
import { execution, isTerminal } from './orchestration'

describe('execution contract', () => {
  it('parses the proposed start response', () => {
    const e = execution.parse({ executionId: 'execution-123', conversationId: 456, status: 'QUEUED', selectedAgents: [], message: 'Execution accepted.' })
    expect(e.executionId).toBe('execution-123')
    expect(e.conversationId).toBe('456')
    expect(e.status).toBe('QUEUED')
    expect(e.steps).toEqual([])
  })
  it('does not invent agents or steps', () => {
    const e = execution.parse({ executionId: 1, status: 'RUNNING' })
    expect(e.selectedAgents).toEqual([])
    expect(e.steps).toEqual([])
  })
  it('maps unknown statuses to UNKNOWN instead of pretending', () => expect(execution.parse({ executionId: 1, status: 'WEIRD' }).status).toBe('UNKNOWN'))
  it('knows which statuses are final', () => {
    expect(['COMPLETED', 'FAILED', 'CANCELLED'].every((s) => isTerminal(s as never))).toBe(true)
    expect(isTerminal('RUNNING')).toBe(false)
    expect(isTerminal('UNKNOWN')).toBe(false)
  })
  it('rejects payloads without an id', () => expect(execution.safeParse({ status: 'RUNNING' }).success).toBe(false))
})

describe('document contract', () => {
  it('treats UPLOADED as not ready and only the ready vocabulary as ready', () => {
    expect(documentPhase('UPLOADED')).toBe('uploaded')
    expect(documentPhase('indexed')).toBe('ready')
    expect(documentPhase('PROCESSING')).toBe('processing')
    expect(documentPhase('FAILED')).toBe('failed')
    expect(documentPhase('SOMETHING_ELSE')).toBe('unknown')
  })
  it('parses the verified upload response', () => {
    const d = documentRecord.parse({ id: 4, fileName: 'a.pdf', fileType: 'application/pdf', fileSize: 10, status: 'UPLOADED', createdAt: '2026-10-20T08:00:00', updatedAt: '2026-10-20T08:00:00' })
    expect(d.id).toBe('4')
  })
})

describe('auth contract', () => {
  it('accepts a token (current backend) or a pending state (OTP backend)', () => {
    expect(registerResponse.safeParse({ accessToken: 'x' }).success).toBe(true)
    expect(registerResponse.safeParse({ status: 'PENDING_VERIFICATION', maskedEmail: 'u***@x.com' }).success).toBe(true)
    expect(registerResponse.safeParse({}).success).toBe(false)
  })
  it('requires a reset token after OTP verification (not an access token field)', () => {
    expect(verifyResetOtpResponse.safeParse({ resetToken: 'r' }).success).toBe(true)
    expect(verifyResetOtpResponse.safeParse({ accessToken: 'a' }).success).toBe(false)
  })
})
