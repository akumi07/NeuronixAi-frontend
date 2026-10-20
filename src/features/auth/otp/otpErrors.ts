import { describeFailure, type Failure } from '../../dashboard/api/failures'
import { effectiveStatus, isApiError } from '../../../api/errors'

export type OtpContext = 'verify' | 'resend' | 'request'

/** Maps stable backend codes (proposed contract) and statuses to messages. Server prose is never shown. */
export function describeOtpFailure(error: unknown, ctx: OtpContext): Failure {
  if (isApiError(error) && error.kind === 'http') {
    const code = error.code
    const status = effectiveStatus(error)
    if (code === 'OTP_EXPIRED' || status === 410) return { title: 'Code expired', message: 'That code has expired. Request a new one.', category: 'validation' }
    if (code === 'OTP_INVALID' || (ctx === 'verify' && status === 400)) return { title: 'Incorrect code', message: 'That code isn’t right. Check it and try again.', category: 'validation' }
    if (code === 'OTP_ATTEMPTS_EXCEEDED') return { title: 'Too many attempts', message: 'Too many incorrect codes. Request a new one.', category: 'rate_limited' }
    if (code === 'OTP_RESEND_TOO_SOON') return { title: 'Please wait', message: 'You can request another code in a moment.', category: 'rate_limited' }
  }
  return describeFailure(error, { planned: true, publicEndpoint: true })
}
