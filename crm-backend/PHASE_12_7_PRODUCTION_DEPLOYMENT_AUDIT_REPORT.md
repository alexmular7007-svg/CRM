# Phase 12.7 — Production Deployment Audit Report

**Date**: August 24, 2026  
**Status**: ✅ AUDIT COMPLETE (Report-only, no code changes)  
**Scope**: Backend & frontend production configuration verification  
**Framework**: Spring Boot + React + Vercel + Railway  

---

## Executive Summary

Phase 12.7 conducted a comprehensive production deployment audit identifying **5 CRITICAL configuration issues** that will prevent production deployment from working correctly. Most critically, **backend URLs are inconsistent across configurations**, which will cause OAuth2 authentication to fail in production.

### Critical Findings

| # | Issue | Files | Impact | Status |
|---|-------|-------|--------|--------|
| 1 | Backend URL Mismatch | application.yml, application-prod.yml, .env.production | OAuth fails | ❌ BLOCKER |
| 2 | Database Password Exposed | .env | Credentials compromised | ❌ BLOCKER |
| 3 | Database URL Hardcoded | application.yml, application-prod.yml | Wrong DB if env missing | ❌ BLOCKER |
| 4 | JWT Secret Exposed | .env | Tokens can be forged | ❌ BLOCKER |
| 5 | Brevo API Key Exposed | .env | Email service compromised | ❌ BLOCKER |

### Production Deployment Status: ❌ **NOT READY**

**Cannot deploy until all 5 CRITICAL issues are resolved.**

---

## 1. 🔴 CRITICAL: Backend URL Mismatch Across Configurations

### The Problem

Three different backend URLs are configured across the codebase:

**URL #1: application.yml (default)**
```yaml
# Line 115-118
spring.security.oauth2.client.registration.google.redirect-uri: 
  "${OAUTH2_REDIRECT_URI_GOOGLE:https://crm-taskflow-production.up.railway.app/login/oauth2/code/google}"
spring.security.oauth2.client.registration.github.redirect-uri: 
  "${OAUTH2_REDIRECT_URI_GITHUB:https://crm-taskflow-production.up.railway.app/login/oauth2/code/github}"
```

**URL #2: application-prod.yml (production profile)**
```yaml
# Lines 65-70
spring.security.oauth2.client.registration.google.redirect-uri: 
  "${OAUTH2_REDIRECT_URI_GOOGLE:https://crm-production-17c2.up.railway.app/login/oauth2/code/google}"
spring.security.oauth2.client.registration.github.redirect-uri: 
  "${OAUTH2_REDIRECT_URI_GITHUB:https://crm-production-17c2.up.railway.app/login/oauth2/code/github}"
```

**URL #3: Frontend (.env.production)**
```
VITE_API_URL=https://crm-production-932d.up.railway.app
VITE_WS_URL=wss://crm-production-932d.up.railway.app/ws
```

**Summary:**
- `application.yml`: `crm-taskflow-production.up.railway.app`
- `application-prod.yml`: `crm-production-17c2.up.railway.app`
- Frontend API: `crm-production-932d.up.railway.app`
- **These are THREE DIFFERENT DOMAINS**

### Why This Breaks OAuth2

**OAuth2 Flow:**
```
1. User clicks "Login with Google"
2. Frontend redirects to: https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=crm-production-932d.up.railway.app/login/oauth2/code/google
3. User authorizes on Google
4. Google redirects back to: crm-production-932d.up.railway.app/login/oauth2/code/google
5. Backend OAuth2 filter expects to find JWT at registered URL
6. But if backend is listening on crm-production-17c2.up.railway.app...
7. OAuth2 REDIRECT_URI_MISMATCH error
```

**If URLs don't match exactly:**
- Google: "This redirect_uri is not registered in your app"
- GitHub: "The redirect_uri included is not registered with the client"
- User sees: `error=redirect_uri_mismatch`
- OAuth login fails completely

### Required Resolution

**Step 1: Determine Actual Production URL**
```bash
# Check Railway dashboard to see actual backend URL
# Is it: crm-production-17c2.up.railway.app OR crm-production-932d.up.railway.app OR something else?
```

**Step 2: Register with OAuth Providers**
1. **Google OAuth Console:**
   - Go to: https://console.cloud.google.com/
   - Project: Find your OAuth2 app
   - Authorized redirect URIs section
   - Add: `https://<ACTUAL_BACKEND_URL>/login/oauth2/code/google`
   - Save

2. **GitHub OAuth App Settings:**
   - Go to: https://github.com/settings/developers
   - Your OAuth Apps
   - Authorization callback URL
   - Set to: `https://<ACTUAL_BACKEND_URL>/login/oauth2/code/github`
   - Save

**Step 3: Update All Configurations**
```yaml
# All three must match <ACTUAL_BACKEND_URL>

# application.yml
OAUTH2_REDIRECT_URI_GOOGLE: https://<ACTUAL_BACKEND_URL>/login/oauth2/code/google
OAUTH2_REDIRECT_URI_GITHUB: https://<ACTUAL_BACKEND_URL>/login/oauth2/code/github

# application-prod.yml
OAUTH2_REDIRECT_URI_GOOGLE: https://<ACTUAL_BACKEND_URL>/login/oauth2/code/google
OAUTH2_REDIRECT_URI_GITHUB: https://<ACTUAL_BACKEND_URL>/login/oauth2/code/github

# .env.production (frontend)
VITE_API_URL=https://<ACTUAL_BACKEND_URL>
VITE_WS_URL=wss://<ACTUAL_BACKEND_URL>/ws
```

**Step 4: Verify Configuration**
```bash
# After deployment, test OAuth flow:
curl -i "https://<ACTUAL_BACKEND_URL>/oauth2/authorization/google"
# Should redirect to Google login (not 404 or 500)
```

---

## 2. 🔴 CRITICAL: Database Password Exposed in .env File

### The Problem

**File**: `crm-backend/.env`  
**Line**: 13  
**Content**: `DATABASE_PASSWORD=TASKFLOWCRM@#12345`

This password is:
- ✗ In version control (git history)
- ✗ Visible to anyone with repo access
- ✗ Exposed if repo is ever made public
- ✗ Same password used in development AND production (.env is development file)

### Impact

If repository is ever compromised:
- Attacker gains direct PostgreSQL access
- All user data exposed (leads, emails, automations, tasks)
- Data can be modified or deleted
- Compliance violations (GDPR, HIPAA if applicable)

### Required Resolution

**Step 1: Immediately Rotate Database Password**
```bash
# In Supabase dashboard:
# 1. Go to Project Settings → Database
# 2. Click "Reset database password"
# 3. Generate new password
# 4. Copy new password
```

**Step 2: Remove from Git History**
```bash
cd crm-backend
# Use git-filter-repo (recommended)
git filter-repo --path .env --invert-paths

# OR use BFG Repo-Cleaner
bfg --delete-files .env

# Force push (caution: force push modifies history)
git push origin --force-with-lease
```

**Step 3: Set Environment Variable**
```bash
# In Railway/deployment platform:
# 1. Go to deployment settings
# 2. Add environment variable:
#    DATABASE_PASSWORD=<NEW_PASSWORD_FROM_STEP_1>
# 3. Deploy
```

**Step 4: Update .gitignore**
```bash
# Ensure .env is already in .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Ensure .env ignored"
git push
```

---

## 3. 🔴 CRITICAL: Database URL Hardcoded with Fallback

### The Problem

**File**: `application.yml` (line 64) and `application-prod.yml` (line 30)

```yaml
datasource:
  url: ${DATABASE_URL:jdbc:postgresql://db.xkzpzcvwzqjavftrnxjl.supabase.co:5432/postgres?sslmode=require}
```

**Issues:**
- Default URL visible in code: `db.xkzpzcvwzqjavftrnxjl` (Supabase project ID)
- If `DATABASE_URL` environment variable is NOT SET:
  - Application connects to default Supabase database
  - Potentially wrong environment (could connect to dev instead of prod)
- Supabase project ID is semi-public but should not be advertised

### Impact

If `DATABASE_URL` is misconfigured or missing:
- Application connects to wrong database
- Data corruption possible
- Wrong environment used

### Required Resolution

**Step 1: Remove Default Fallback**
```yaml
# CHANGE FROM:
url: ${DATABASE_URL:jdbc:postgresql://db.xkzpzcvwzqjavftrnxjl.supabase.co:5432/postgres?sslmode=require}

# CHANGE TO:
url: ${DATABASE_URL}  # NO DEFAULT - REQUIRED
username: ${DATABASE_USERNAME}  # NO DEFAULT - REQUIRED
password: ${DATABASE_PASSWORD}  # NO DEFAULT - REQUIRED
```

**Step 2: Ensure Environment Variables Set**
```bash
# In deployment platform, verify these are SET:
DATABASE_URL=jdbc:postgresql://db.xkzpzcvwzqjavftrnxjl.supabase.co:5432/postgres?sslmode=require
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=<ROTATED_PASSWORD>
```

---

## 4. 🔴 CRITICAL: JWT Secret Exposed in .env File

### The Problem

**File**: `crm-backend/.env`  
**Line**: 15  
**Content**: `JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`

This secret is:
- ✗ In version control (git history)
- ✗ Used to sign/verify JWT tokens
- ✗ If compromised, attackers can forge JWTs for ANY user
- ✗ Same secret used in dev and prod (.env is development file)

### Impact

If JWT secret is compromised:
- Attacker can forge tokens claiming to be any user
- Complete account takeover
- Can impersonate admin users
- CRITICAL security breach

### Required Resolution

**Step 1: Generate New JWT Secret**
```bash
# Generate 32-byte random secret (256 bits)
openssl rand -base64 32
# Output example: X9f8kL2m9N4pQrSt5uVwXyZ1aB3cD5eF7gH9iJ1kL=
```

**Step 2: Set in Production Environment**
```bash
# In deployment platform:
# 1. Add environment variable:
#    JWT_SECRET=<NEW_SECRET_FROM_STEP_1>
# 2. Deploy
```

**Step 3: Remove from Git History**
```bash
# Same as database password - use git-filter-repo to remove
git filter-repo --path .env --invert-paths
git push origin --force-with-lease
```

**Step 4: Invalidate Existing Tokens**
```bash
# Option 1: Set token expiration to 0 (immediately expire all tokens)
# Option 2: Clear JWT cache in Redis (if used)
# Option 3: Users will be logged out after token expires (default behavior)

# Current expiration: 24 hours (from Phase 12.6 audit)
# Tokens will be invalid after 24 hours automatically
```

**Step 5: Use Different Secret for Each Environment**
```bash
# Development (.env): 
JWT_SECRET=<DEV_SECRET>

# Production (env var):
JWT_SECRET=<PROD_SECRET>

# Staging (if applicable):
JWT_SECRET=<STAGING_SECRET>
```

---

## 5. 🔴 CRITICAL: Brevo API Key Exposed in .env File

### The Problem

**File**: `crm-backend/.env`  
**Line**: 48  
**Content**: `BREVO_API_KEY=xsmtpsib-1a0b683362f9729d7968bf60f1f528af2d315348ea19a274468c4db78f712a3c-JBJV4ih6bFCPABIa`

This API key is:
- ✗ In version control (git history)
- ✗ Used to send emails on your behalf
- ✗ If compromised, attacker can send spam/phishing emails
- ✗ Damages sender reputation, legal liability

### Impact

If Brevo API key is compromised:
- Attacker can send unlimited emails from your account
- Spam sent to your users
- Phishing attacks using your domain
- IP reputation damaged
- Email blacklisted
- Billing fraud (attacker sends thousands of emails)

### Required Resolution

**Step 1: Revoke Current API Key**
```bash
# In Brevo dashboard:
# 1. Go to Account → API Keys
# 2. Find and delete the exposed key
# 3. Create new API key
# 4. Copy new key
```

**Step 2: Set in Production Environment**
```bash
# In deployment platform:
# 1. Add environment variable:
#    BREVO_API_KEY=<NEW_KEY_FROM_STEP_1>
# 2. Deploy
```

**Step 3: Remove from Git History**
```bash
git filter-repo --path .env --invert-paths
git push origin --force-with-lease
```

**Step 4: Monitor Email Activity**
```bash
# In Brevo dashboard, monitor:
# - Email sending logs
# - Bounces (if high, IP may be blacklisted)
# - Complaints (spam reports)
# - Delivery rate
```

---

## 6. 🟡 HIGH: CORS Wildcard Pattern in Production

### The Problem

**File**: `application-prod.yml` (line 43)

```yaml
websocket:
  allowed-origins: ${WEBSOCKET_ALLOWED_ORIGINS:https://crm-taskflow.vercel.app,https://*.vercel.app}
```

**File**: `CorsConfig.java` (line 55-56)

```java
patterns.addAll(List.of(
    "https://*.vercel.app"  // Wildcard - accepts ANY Vercel subdomain
));
```

**Issues:**
- Wildcard `*.vercel.app` matches:
  - `evil.vercel.app` (attacker's deployment)
  - `anyname.vercel.app` (anyone's deployment)
  - Not just your app
- Combined with credentials=true (from Phase 12.6), allows cross-site attacks
- Mitigated by JWT authentication but still high risk

### Impact

If attacker deploys to Vercel:
- They can make WebSocket connections to your backend
- They can make API requests to your backend
- If JWT is compromised elsewhere, attacker can use this to access your backend
- Increased attack surface

### Recommended Resolution

**For Development:**
```yaml
# Keep wildcard for preview deployments
WEBSOCKET_ALLOWED_ORIGINS=https://crm-taskflow.vercel.app,https://*.vercel.app
```

**For Production:**
```yaml
# Restrict to only your production domain
WEBSOCKET_ALLOWED_ORIGINS=https://crm-taskflow.vercel.app,https://staging-crm-taskflow.vercel.app
```

---

## 7. 🟡 HIGH: Logging Exposure Risk

### The Problem

**File**: `application-dev.yml` (lines 24-31)

```yaml
logging:
  level:
    root: INFO
    com.arjun.crm: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: TRACE
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

**Risk:**
- If `SPRING_PROFILES_ACTIVE` is not explicitly set to `prod` in production
- OR if developer accidentally pushes `SPRING_PROFILES_ACTIVE=dev` to git
- Application runs with DEBUG/TRACE logging
- SQL queries with parameters logged: `SELECT * FROM users WHERE email = 'user@example.com'`
- Security details exposed

### Impact

If development profile runs in production:
- SQL queries logged with bound parameters (includes user data)
- Security authentication details logged
- Performance degraded by verbose logging
- Log files become huge
- PII (email addresses, names) exposed in logs

### Verification Needed

**Confirm production configuration is correct:**
```yaml
# In application-prod.yml (lines 25-31) - ✅ CORRECT
logging:
  level:
    root: WARN
    com.arjun.crm: INFO
    org.springframework.web: WARN
    org.springframework.security: WARN
    org.hibernate.SQL: WARN
```

**Ensure environment variable is set:**
```bash
# In deployment platform:
# SPRING_PROFILES_ACTIVE=prod
# (NOT dev, NOT empty)
```

---

## 8. 🟡 MEDIUM: Spring Profile Not Explicitly Set

### The Problem

**File**: `application.yml` (line 49)

```yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}  # DEFAULT IS DEV!
```

**Risk:**
- If `SPRING_PROFILES_ACTIVE` environment variable is NOT SET
- Application defaults to `dev` profile
- Development configuration loads in production
- DEBUG logging, Swagger enabled, all actuator endpoints exposed

### Required Resolution

**Step 1: Ensure Environment Variable is Set**
```bash
# In deployment platform (Railway, Vercel, etc.):
# Add environment variable:
SPRING_PROFILES_ACTIVE=prod
```

**Step 2: Verify at Startup**
Add logging to confirm profile:
```
# Expected output in logs:
"Started CrmBackendApplication in X.XXX seconds"
"The following profiles are active: prod"
```

---

## 9. 🟡 MEDIUM: API Documentation Enabled by Default

### The Problem

**File**: `application.yml` (lines 446-449)

```yaml
springdoc:
  api-docs:
    enabled: ${API_DOCS_ENABLED:true}  # DEFAULT IS ENABLED
  swagger-ui:
    enabled: ${SWAGGER_UI_ENABLED:true}  # DEFAULT IS ENABLED
```

**Risk:**
- If `API_DOCS_ENABLED` environment variable is NOT SET
- If `SWAGGER_UI_ENABLED` environment variable is NOT SET
- Swagger UI exposes entire API structure
- Attackers can see all endpoints, parameters, response formats
- Information disclosure vulnerability

**Production Configuration (✅ Correct):**
```yaml
# In application-prod.yml (lines 50-53):
springdoc:
  api-docs:
    enabled: false  # ✅ Disabled in prod
  swagger-ui:
    enabled: false  # ✅ Disabled in prod
```

### Required Resolution

**Ensure environment variables are set or change default:**
```bash
# Option 1: Set environment variable
API_DOCS_ENABLED=false
SWAGGER_UI_ENABLED=false

# Option 2: Change default in application.yml
API_DOCS_ENABLED: ${API_DOCS_ENABLED:false}  # Default to false
SWAGGER_UI_ENABLED: ${SWAGGER_UI_ENABLED:false}  # Default to false
```

---

## 10. 🟡 MEDIUM: Redis Configuration Mismatch

### The Problem

**File**: `application.yml` (line 307)

```yaml
cache:
  type: redis  # Expects Redis
```

**File**: `application-prod.yml` (lines 44-46)

```yaml
autoconfigure:
  exclude: ${SPRING_AUTOCONFIGURE_EXCLUDE:...RedisAutoConfiguration...}
  # Redis is EXCLUDED by default
```

**Conflict:**
- Cache type set to `redis`
- But Redis auto-configuration excluded
- Cache layer may fail if Redis not available

### Clarification Needed

1. **Is Redis available in production?**
   - If YES: Set `REDIS_ENABLED=true`
   - If NO: Change cache type to `simple` or `none`

2. **What is the intended behavior?**
   - Redis used for: Presence tracking, real-time user status
   - Without Redis: Presence tracking won't work, but app functions

### Required Resolution

**Option 1: With Redis (if available)**
```bash
# Environment variable:
REDIS_ENABLED=true
REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
```

**Option 2: Without Redis (if not available)**
```yaml
# In application-prod.yml:
cache:
  type: simple  # Use simple in-memory cache instead
```

---

## CONFIGURATION CORRECTNESS VERIFICATION

### ✅ Configurations That ARE Correct

**HTTPS/HSTS Headers (application-prod.yml & SecurityConfig.java)**
- ✅ HSTS enabled: `max-age: 31536000` (1 year)
- ✅ HSTS preload enabled: `preload: true`
- ✅ Include subdomains: `includeSubDomains: true`
- ✅ X-Content-Type-Options: `nosniff`
- ✅ X-Frame-Options: `DENY`

**Error Handling (application-prod.yml)**
- ✅ Stack traces NOT included: `include-stacktrace: never`
- ✅ Exceptions NOT included: `include-exception: false`
- ✅ Information disclosure prevented

**Actuator Endpoints (application-prod.yml)**
- ✅ Restricted to: `health,info,metrics,prometheus`
- ✅ Excluded: `env`, `beans`, `configprops`, `threaddump` (dangerous endpoints)
- ✅ Health details: `show-details: when-authorized`

**Brevo Webhook**
- ✅ Secret is environment variable: `${BREVO_WEBHOOK_SECRET}`
- ✅ Not hardcoded

**Frontend Security**
- ✅ No secrets exposed in `.env.production`
- ✅ OAuth client IDs are public (correct)
- ✅ No API keys in frontend code

---

## Summary Table: All Configuration Issues

| Priority | Category | Issue | File | Impact | Resolution |
|----------|----------|-------|------|--------|-----------|
| 🔴 CRITICAL | URLs | Backend URL Mismatch | application.yml, application-prod.yml, .env.production | OAuth fails | Unify URLs |
| 🔴 CRITICAL | Security | DB Password Exposed | .env | Credentials compromised | Rotate password, remove from git |
| 🔴 CRITICAL | Config | DB URL Hardcoded | application.yml, application-prod.yml | Wrong DB if env missing | Remove defaults |
| 🔴 CRITICAL | Security | JWT Secret Exposed | .env | Tokens forged | Rotate secret, remove from git |
| 🔴 CRITICAL | Security | Brevo API Key Exposed | .env | Email abuse | Rotate key, remove from git |
| 🟡 HIGH | Security | CORS Wildcard | application-prod.yml | Increased attack surface | Restrict to prod domains |
| 🟡 HIGH | Config | Logging Exposure | application-dev.yml | Info disclosure | Ensure prod profile active |
| 🟡 MEDIUM | Config | Profile Default | application.yml | Dev config in prod | Set SPRING_PROFILES_ACTIVE |
| 🟡 MEDIUM | Security | API Docs Enabled | application.yml | API structure exposed | Disable by default |
| 🟡 MEDIUM | Config | Redis Mismatch | application.yml, application-prod.yml | Cache may fail | Clarify Redis strategy |

---

## DEPLOYMENT READINESS ASSESSMENT

### Current Status: ❌ **NOT READY FOR PRODUCTION**

**Blocking Issues:**
1. ❌ Backend URL mismatch (OAuth will fail)
2. ❌ Database credentials exposed (security breach)
3. ❌ JWT secret exposed (account takeover risk)
4. ❌ Brevo API key exposed (email abuse risk)
5. ❌ Database URL hardcoded (may connect to wrong DB)

**Can Deploy After:**
- ✅ All credentials rotated and set as environment variables
- ✅ Backend URLs unified and consistent
- ✅ OAuth providers updated with correct redirect URIs
- ✅ Git history cleaned (credentials removed)
- ✅ SPRING_PROFILES_ACTIVE explicitly set to "prod"

---

## Conclusion

Phase 12.7 identified 10 configuration issues affecting production readiness. **5 are CRITICAL and must be resolved before any production deployment.** The main blocker is the **backend URL mismatch** which will cause OAuth2 authentication to fail immediately when users try to log in.

**Estimated Time to Fix:** 2-4 hours  
**Complexity:** Medium (mostly environment variable configuration)  
**Risk Level if Deployed As-Is:** 🔴 CRITICAL

---

**Report Complete**: Phase 12.7 Production Deployment Audit

