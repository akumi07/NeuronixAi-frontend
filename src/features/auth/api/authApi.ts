import { callEndpoint } from '../../../api/call'
import { accessTokenResponse, registerResponse, type AccessTokenResponse, type RegisterResponse } from '../../../api/contracts/auth'
import { ENDPOINTS } from '../../../api/endpoints'
import { apiRequest } from './httpClient'

/**
 * Implemented backend endpoints (verified in com.neuronix.auth.AuthController):
 *   POST /api/v1/auth/login     {email,password}  -> {accessToken}
 *   POST /api/v1/auth/register  {email,password}  -> {accessToken}   (no OTP step today; a pending-verification body is also accepted)
 *   POST /api/v1/auth/logout    Bearer            -> "Logged out successfully"
 * OTP and password-recovery endpoints are proposed contracts: see src/api/endpoints.ts and docs/API_CONTRACT.md.
 * The legacy forget-password/new-password "reset" flow is intentionally NOT used: it hands out a regular access token.
 */
const publicRequester = apiRequest as never

export const authApi = {
  login: (email: string, password: string): Promise<AccessTokenResponse> =>
    callEndpoint(publicRequester, ENDPOINTS.auth.login, { body: { email, password }, schema: accessTokenResponse }),
  register: (email: string, password: string): Promise<RegisterResponse> =>
    callEndpoint(publicRequester, ENDPOINTS.auth.register, { body: { email, password }, schema: registerResponse }),
  logout: (token: string) => apiRequest<string>('POST', ENDPOINTS.auth.logout.path(), { bearer: token }),
}
