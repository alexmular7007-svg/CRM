# Production Environment Deployment Checklist

**Application**: CRM + Task Manager + Chat Application  
**Backend**: Spring Boot + PostgreSQL (Supabase) + Railway  
**Frontend**: React + Vite + Vercel  
**Date Prepared**: August 24, 2026  

---

## 🔴 CRITICAL: Must Complete Before Any Deployment

### 1. Resolve Backend URL Mismatch

- [ ] **Determine actual production backend URL**
  - [ ] Check Railway dashboard for actual deployed URL
  - [ ] Is it: `crm-production-17c2.up.railway.app`?
  - [ ] Or: `crm-production-932d.up.railway.app`?
  - [ ] Or: Another URL?
  - **Actual URL**: `_________________________________`

- [ ] **Register URL with Google OAuth**
  - [ ] Go to: https://console.cloud.google.com/
  - [ ] Select project for your app
  - [ ] Go to Credentials → OAuth 2.0 Client IDs
  - [ ] Add Authorized redirect URI: `https://<BACKEND_URL>/login/oauth2/code/google`
  - [ ] Save

- [ ] **Register URL with GitHub OAuth**
  - [ ] Go to: https://github.com/settings/developers
  - [ ] Select OAuth App
  - [ ] Set Authorization callback URL to: `https://<BACKEND_URL>/login/oauth2/code/github`
  - [ ] Save

- [ ] **Update application.yml**
  - [ ] Update OAUTH2_REDIRECT_URI_GOOGLE default
  - [ ] Update OAUTH2_REDIRECT_URI_GITHUB default

- [ ] **Update application-prod.yml**
  - [ ] Verify OAUTH2_REDIRECT_URI_GOOGLE matches
  - [ ] Verify OAUTH2_REDIRECT_URI_GITHUB matches

- [ ] **Update .env.production**
  - [ ] VITE_API_URL=`https://<BACKEND_URL>`
  - [ ] VITE_WS_URL=`wss://<BACKEND_URL>/ws`

- [ ] **Test OAuth Flow**
  ```bash
  # After deployment, test:
  curl -i "https://<BACKEND_URL>/oauth2/authorization/google"
  # Should redirect to Google login (HTTP 302)
  ```

---

### 2. Rotate All Exposed Credentials

- [ ] **Database Password**
  - [ ] Log into Supabase dashboard
  - [ ] Go to Project Settings → Database
  - [ ] Click "Reset database password"
  - [ ] Copy new password: `_________________________________`
  - [ ] Remove old password from .env
  - [ ] Set DATABASE_PASSWORD environment variable

- [ ] **JWT Secret**
  - [ ] Generate new secret: `openssl rand -base64 32`
  - [ ] New secret: `_________________________________`
  - [ ] Remove old secret from .env
  - [ ] Set JWT_SECRET environment variable

- [ ] **Brevo API Key**
  - [ ] Log into Brevo dashboard
  - [ ] Go to Account → API Keys
  - [ ] Delete old API key
  - [ ] Create new API key
  - [ ] Copy new key: `_________________________________`
  - [ ] Remove old key from .env
  - [ ] Set BREVO_API_KEY environment variable

- [ ] **Google OAuth Client Secret**
  - [ ] (Should be in environment variables only, never in .env)
  - [ ] Set GOOGLE_CLIENT_SECRET environment variable

- [ ] **GitHub OAuth Client Secret**
  - [ ] (Should be in environment variables only, never in .env)
  - [ ] Set GITHUB_CLIENT_SECRET environment variable

---

### 3. Clean Git History

- [ ] **Remove .env from git history**
  ```bash
  git filter-repo --path .env --invert-paths
  git push origin --force-with-lease
  ```
  - [ ] Verify .env removed from history on GitHub/GitLab

- [ ] **Verify .gitignore**
  ```bash
  cat .gitignore | grep "\.env"
  # Should output: .env
  ```

- [ ] **Ensure no other files contain secrets**
  ```bash
  # Search for patterns
  grep -r "BREVO_API_KEY" . --exclude-dir=.git
  grep -r "DATABASE_PASSWORD" . --exclude-dir=.git
  grep -r "JWT_SECRET" . --exclude-dir=.git
  # Should return NO results
  ```

---

### 4. Set Environment Variables in Production

**In your deployment platform (Railway, Vercel, AWS, etc.):**

- [ ] **Backend Environment Variables (Railway)**
  - [ ] `SPRING_PROFILES_ACTIVE=prod`
  - [ ] `DATABASE_URL=jdbc:postgresql://db.xkzpzcvwzqjavftrnxjl.supabase.co:5432/postgres?sslmode=require`
  - [ ] `DATABASE_USERNAME=postgres`
  - [ ] `DATABASE_PASSWORD=<NEW_PASSWORD>`
  - [ ] `JWT_SECRET=<NEW_SECRET>`
  - [ ] `JWT_EXPIRATION=900000` (15 minutes, not 24 hours)
  - [ ] `GOOGLE_CLIENT_ID=868446398693-tpstebo709mvs71sgl2dn53bkvmktdlo.apps.googleusercontent.com`
  - [ ] `GOOGLE_CLIENT_SECRET=<SECRET_FROM_GOOGLE_CONSOLE>`
  - [ ] `GITHUB_CLIENT_ID=Ov23limUdSzMDoTdWkX5`
  - [ ] `GITHUB_CLIENT_SECRET=<SECRET_FROM_GITHUB>`
  - [ ] `BREVO_API_KEY=<NEW_API_KEY>`
  - [ ] `BREVO_WEBHOOK_SECRET=<WEBHOOK_SECRET>`
  - [ ] `SUPABASE_ANON_KEY=<ANON_KEY>`
  - [ ] `SUPABASE_SERVICE_KEY=<SERVICE_KEY>`
  - [ ] `XAI_API_KEY=<API_KEY>`
  - [ ] `CORS_ALLOWED_ORIGINS=https://crm-taskflow.vercel.app`
  - [ ] `WEBSOCKET_ALLOWED_ORIGINS=https://crm-taskflow.vercel.app`
  - [ ] `API_DOCS_ENABLED=false`
  - [ ] `SWAGGER_UI_ENABLED=false`
  - [ ] `REDIS_ENABLED=true` (or false if Redis not available)

- [ ] **Frontend Environment Variables (Vercel)**
  - [ ] `VITE_API_URL=https://<BACKEND_URL>`
  - [ ] `VITE_WS_URL=wss://<BACKEND_URL>/ws`
  - [ ] `VITE_GOOGLE_CLIENT_ID=868446398693-tpstebo709mvs71sgl2dn53bkvmktdlo.apps.googleusercontent.com`
  - [ ] `VITE_GITHUB_CLIENT_ID=Ov23limUdSzMDoTdWkX5`

---

## 🟡 HIGH PRIORITY: Verify Before Deployment

### 5. Verify Database Configuration

- [ ] **Connection String Correct**
  - [ ] DATABASE_URL uses correct Supabase project
  - [ ] SSL mode: `sslmode=require`
  - [ ] Port: `5432`

- [ ] **Connection Pool Settings**
  - [ ] `maximum-pool-size: 20` (appropriate for production)
  - [ ] `minimum-idle: 10`
  - [ ] `connection-timeout: 30000`

- [ ] **Test Connection**
  ```bash
  psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co \
       -U postgres \
       -d postgres \
       -p 5432
  # Should connect successfully with new password
  ```

---

### 6. Verify OAuth Configuration

- [ ] **Google OAuth Redirect URI**
  - [ ] Registered in Google Console: `https://<BACKEND_URL>/login/oauth2/code/google`
  - [ ] Matches OAUTH2_REDIRECT_URI_GOOGLE in configs
  - [ ] Client ID correct: `868446398693-tpstebo709mvs71sgl2dn53bkvmktdlo.apps.googleusercontent.com`
  - [ ] Client Secret set in environment variable

- [ ] **GitHub OAuth Redirect URI**
  - [ ] Registered in GitHub OAuth App: `https://<BACKEND_URL>/login/oauth2/code/github`
  - [ ] Matches OAUTH2_REDIRECT_URI_GITHUB in configs
  - [ ] Client ID correct: `Ov23limUdSzMDoTdWkX5`
  - [ ] Client Secret set in environment variable

- [ ] **Test OAuth Flow**
  - [ ] Deploy and access frontend
  - [ ] Click "Login with Google"
  - [ ] Should redirect to Google login
  - [ ] Authorize
  - [ ] Should redirect back to app
  - [ ] User should be logged in
  - [ ] Repeat with "Login with GitHub"

---

### 7. Verify Brevo Email Configuration

- [ ] **API Key Set**
  - [ ] `BREVO_API_KEY` environment variable set
  - [ ] API key is NEW (rotated from exposed one)

- [ ] **Webhook Secret Set**
  - [ ] `BREVO_WEBHOOK_SECRET` environment variable set

- [ ] **Webhook URL Configured in Brevo**
  - [ ] Go to Brevo dashboard → Webhooks
  - [ ] URL: `https://<BACKEND_URL>/api/webhooks/brevo`
  - [ ] Events: Email opened, Email clicked, Email hard bounce, etc.

- [ ] **Test Email Sending**
  - [ ] Create lead magnet
  - [ ] Submit form
  - [ ] Should send confirmation email
  - [ ] Check email received

---

### 8. Verify AI Provider Configuration

- [ ] **XAI API Key Set**
  - [ ] `XAI_API_KEY` environment variable set
  - [ ] Using production key (if different from dev)

- [ ] **API Endpoint Correct**
  - [ ] `XAI_BASE_URL=https://api.x.ai/v1/chat/completions`

- [ ] **Test AI Generation**
  - [ ] Go to AI Email Generator
  - [ ] Generate email
  - [ ] Should produce output
  - [ ] No API errors

---

### 9. Verify CORS Configuration

- [ ] **Frontend Domain Allowed**
  - [ ] `CORS_ALLOWED_ORIGINS=https://crm-taskflow.vercel.app`

- [ ] **WebSocket Origins Configured**
  - [ ] `WEBSOCKET_ALLOWED_ORIGINS=https://crm-taskflow.vercel.app`
  - [ ] Remove wildcard `*.vercel.app` in production

- [ ] **Test CORS**
  ```bash
  curl -H "Origin: https://crm-taskflow.vercel.app" \
       -H "Access-Control-Request-Method: GET" \
       https://<BACKEND_URL>/api/users
  # Should return CORS headers
  ```

---

### 10. Verify Logging Configuration

- [ ] **Spring Profile Active Verification**
  - [ ] Set `SPRING_PROFILES_ACTIVE=prod`
  - [ ] Check startup logs:
    ```
    "The following profiles are active: prod"
    ```

- [ ] **Log Levels Correct**
  - [ ] Root: WARN
  - [ ] com.arjun.crm: INFO
  - [ ] org.springframework.security: WARN
  - [ ] org.hibernate.SQL: WARN

- [ ] **No Debug/Trace Logs**
  - [ ] Check logs do NOT contain:
    - `DEBUG` entries from Spring Security
    - `TRACE` entries with SQL parameters
    - Email addresses or sensitive data

---

### 11. Verify Actuator Security

- [ ] **Endpoints Restricted**
  - [ ] Only exposed: `health`, `info`, `metrics`, `prometheus`
  - [ ] Test endpoints are inaccessible:
    ```bash
    curl https://<BACKEND_URL>/actuator/env
    # Should return: 404 or 403
    ```

- [ ] **Health Endpoint**
  - [ ] Test: `curl https://<BACKEND_URL>/actuator/health`
  - [ ] Should return UP or OK

---

### 12. Verify SSL/HTTPS

- [ ] **Valid SSL Certificate**
  - [ ] Certificate for `<BACKEND_URL>` is valid
  - [ ] Not self-signed

- [ ] **HSTS Headers Present**
  - [ ] Test: `curl -i https://<BACKEND_URL> | grep Strict-Transport-Security`
  - [ ] Should output:
    ```
    Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
    ```

- [ ] **SSL Labs Test**
  - [ ] Go to https://www.ssllabs.com/ssltest/
  - [ ] Enter `<BACKEND_URL>`
  - [ ] Should get A+ grade

---

### 13. Verify Frontend Build

- [ ] **Build Configuration Correct**
  - [ ] `vite.config.js` configured for production
  - [ ] API URL points to production backend
  - [ ] OAuth redirect URIs match

- [ ] **Environment Variables Correct**
  - [ ] `.env.production` has correct backend URL
  - [ ] No development URLs in production build

- [ ] **Test Frontend**
  - [ ] Navigate to https://crm-taskflow.vercel.app
  - [ ] Should load without errors
  - [ ] Network tab should show API calls going to production backend

---

## ✅ FINAL: Pre-Deployment Testing

### 14. End-to-End Testing

- [ ] **Complete User Journey**
  - [ ] [ ] Navigate to landing page
  - [ ] [ ] Click "Login with Google"
  - [ ] [ ] Authorize with Google
  - [ ] [ ] Redirected back to app and logged in
  - [ ] [ ] Dashboard loads
  - [ ] [ ] Create a lead magnet
  - [ ] [ ] View lead magnet
  - [ ] [ ] Submit form
  - [ ] [ ] Receive confirmation email
  - [ ] [ ] Check email received in inbox

- [ ] **GitHub OAuth Flow**
  - [ ] [ ] Log out
  - [ ] [ ] Click "Login with GitHub"
  - [ ] [ ] Authorize with GitHub
  - [ ] [ ] Redirected back to app and logged in

- [ ] **Core Features**
  - [ ] [ ] Create email campaign
  - [ ] [ ] Add recipient
  - [ ] [ ] Generate email with AI
  - [ ] [ ] Send campaign
  - [ ] [ ] Create automation
  - [ ] [ ] Create workspace
  - [ ] [ ] Invite team member

- [ ] **Error Handling**
  - [ ] [ ] Test invalid email
  - [ ] [ ] Test 404 page
  - [ ] [ ] Check error responses don't expose stack traces

---

### 15. Security Verification

- [ ] **No Exposed Credentials**
  - [ ] Browser DevTools: Network tab
  - [ ] No JWT tokens visible in responses (embedded in cookies)
  - [ ] No API keys in requests
  - [ ] No secrets in localStorage

- [ ] **CORS Restrictions**
  - [ ] Test from different domain
  - [ ] Should be blocked by CORS

- [ ] **HTTPS Only**
  - [ ] Try accessing via HTTP
  - [ ] Should redirect to HTTPS

- [ ] **Security Headers**
  - [ ] Check: https://securityheaders.com/
  - [ ] Enter `https://<BACKEND_URL>`
  - [ ] Should show all headers configured

---

### 16. Performance Verification

- [ ] **API Response Times**
  - [ ] Dashboard load: < 1 second
  - [ ] List pages: < 2 seconds
  - [ ] Search: < 2 seconds

- [ ] **WebSocket Connection**
  - [ ] Real-time presence tracking works
  - [ ] No connection errors in console

- [ ] **Database Performance**
  - [ ] No slow queries in logs
  - [ ] Connection pool is not exhausted

---

## ⚠️ DEPLOYMENT FINAL CHECKLIST

### Before Going Live

- [ ] **All CRITICAL issues resolved**
  - [ ] Backend URLs unified
  - [ ] Credentials rotated and set as environment variables
  - [ ] Git history cleaned

- [ ] **All HIGH priority items verified**
  - [ ] Database connection working
  - [ ] OAuth working
  - [ ] Email working
  - [ ] Logging correct

- [ ] **End-to-end testing complete**
  - [ ] User journey tested
  - [ ] No errors
  - [ ] Security headers present

- [ ] **Monitoring set up**
  - [ ] Error tracking (Sentry, etc.)
  - [ ] Performance monitoring (New Relic, etc.)
  - [ ] Log aggregation
  - [ ] Alert notifications

- [ ] **Backup created**
  - [ ] Database backed up
  - [ ] Code tagged in git

---

## Post-Deployment (First 24 Hours)

- [ ] **Monitor error logs**
  - [ ] Check for any runtime errors
  - [ ] Verify no credential issues

- [ ] **Monitor email delivery**
  - [ ] Check Brevo dashboard
  - [ ] Verify emails being sent successfully

- [ ] **Check API response times**
  - [ ] Verify performance baseline established

- [ ] **User feedback**
  - [ ] Check if users can log in
  - [ ] Check if core features work

- [ ] **Rollback plan ready**
  - [ ] Know how to revert if critical issue found
  - [ ] Have previous version running or backup ready

---

## Notes

**Date Production Deployment Planned**: `_________________________________`

**Deployed By**: `_________________________________`

**Deployment Platform**: Railway (Backend) + Vercel (Frontend) + Supabase (Database)

**Deployment Approved By**: `_________________________________`

**Issues Encountered During Deployment**: 
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Checklist Prepared**: August 24, 2026  
**Last Updated**: `_________________________________`

