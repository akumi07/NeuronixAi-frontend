import { apiRequest } from './httpClient'

/**
 * Verified against the Spring Boot backend (akumi07/NeuronixAI, com.neuronix.auth.AuthController):
 *   POST /api/v1/auth/login            {email,password}  -> {accessToken}
 *   POST /api/v1/auth/register         {email,password}  -> {accessToken}
 *   POST /api/v1/auth/forget-password  {email}           -> {accessToken}  (used as the reset credential)
 *   POST /api/v1/auth/new-password     Bearer <token>, {password} -> 200 empty
 *   POST /api/v1/auth/logout           Bearer <token>    -> "Logged out successfully"
 * See docs/AUTHENTICATION.md.
 */
interface AuthResponse {
  accessToken: string
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('POST', '/api/v1/auth/login', { body: { email, password } }),
  register: (email: string, password: string) =>
    apiRequest<AuthResponse>('POST', '/api/v1/auth/register', { body: { email, password } }),
  forgetPassword: (email: string) =>
    apiRequest<AuthResponse>('POST', '/api/v1/auth/forget-password', { body: { email } }),
  newPassword: (resetToken: string, password: string) =>
    apiRequest<void>('POST', '/api/v1/auth/new-password', { bearer: resetToken, body: { password } }),
  logout: (token: string) => apiRequest<string>('POST', '/api/v1/auth/logout', { bearer: token }),
}
