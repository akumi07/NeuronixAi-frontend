# Security headers and deployment

The frontend is static files plus calls to the Spring Boot API. A `<meta>` Content-Security-Policy is injected into **production builds only** (see `vite.config.ts`):
`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' [API origin]; object-src 'none'; base-uri 'self'; form-action 'self'`.
No CSP violations were observed in a full browser pass over every screen against `vite preview`.

A meta CSP cannot express `frame-ancestors`, and headers are better set by the server. Set these on the host serving the static files (nginx/CloudFront/etc.):

```
Content-Security-Policy: (same policy as above) + frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(self), geolocation=()   (microphone is needed for voice input in the chat composer)
Cache-Control: no-store   (for index.html; hashed /assets/* may be cached)
```
- Serve the app and the API from the **same origin** (reverse proxy `/api` and `/actuator/health`). The backend has no CORS configuration; if a separate origin is required, add CORS server-side (explicit origin allow-list, `Authorization` header, no credentials) and set `VITE_API_BASE_URL` (non-secret) so the CSP `connect-src` is generated.
- Use HTTPS only. The client sends a bearer token in the `Authorization` header; over plain HTTP it can be intercepted.
- Never put secrets in `VITE_*` variables: they are embedded in the public bundle.
