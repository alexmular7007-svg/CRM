import { createSlice } from '@reduxjs/toolkit'

/**
 * ⚠️ SECURITY CRITICAL: JWT Token Storage & XSS Vulnerability
 * 
 * CURRENT IMPLEMENTATION:
 * - JWT tokens stored in browser localStorage
 * - User object stored in localStorage
 * 
 * XSS ATTACK SURFACE:
 * - localStorage is accessible to any JavaScript code (including malicious scripts)
 * - XSS vulnerability allows attackers to:
 *   1. Steal the token via localStorage.getItem('token')
 *   2. Steal user data via localStorage.getItem('user')
 *   3. Impersonate the authenticated user
 *   4. Access all protected resources
 * 
 * ATTACK VECTORS:
 * - Malicious scripts injected via user input (if not properly sanitized)
 * - Third-party library vulnerabilities
 * - DOM-based XSS via dangerouslySetInnerHTML or eval()
 * - Compromised CDN or extension
 * 
 * CURRENT MITIGATIONS (Defense in Depth):
 * 1. Backend input validation and sanitization (prevents most XSS injection)
 * 2. CORS restrictions (blocks cross-origin token theft)
 * 3. Content Security Policy (CSP) headers (restricts script execution)
 * 4. No eval(), Function(), or dangerouslySetInnerHTML usage
 * 5. DOMPurify or equivalent sanitization on user input rendering
 * 6. Security headers: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
 * 
 * RECOMMENDED LONG-TERM FIXES (Priority Order):
 * 1. [HIGH] Move token to httpOnly, Secure, SameSite cookie
 *    - Backend must set Set-Cookie header with httpOnly flag
 *    - Cookie automatically included in requests, not accessible to JavaScript
 *    - Requires HTTPS in production
 * 2. [HIGH] Implement CSRF protection (Double Submit Cookie or CSRF tokens)
 *    - Required when moving to cookies
 * 3. [MEDIUM] Add token expiration and refresh token rotation
 *    - Reduce exposure window if token is compromised
 * 4. [MEDIUM] Implement Content Security Policy (CSP) with nonce/hash
 *    - Strict CSP prevents most XSS attacks
 * 5. [LOW] Regular security audits and penetration testing
 * 
 * FRONTEND BEST PRACTICES (Current):
 * - Never log tokens or sensitive data to console
 * - Sanitize all external data before rendering
 * - Use React's built-in XSS protection (auto-escapes text content)
 * - Validate CORS origin on all API responses
 * - Clear tokens on logout (done in logout action)
 * - Clear stale data to prevent token reuse after logout
 */

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.error = null
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Clear workspace/project state so stale IDs don't persist to the next user
      localStorage.removeItem('currentWorkspace')
      localStorage.removeItem('currentProject')
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions

export default authSlice.reducer
