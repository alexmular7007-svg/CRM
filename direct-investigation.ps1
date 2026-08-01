# Direct Investigation - Using curl with proper auth
$ErrorActionPreference = "Continue"

Write-Host "========================================================================"
Write-Host "           DIRECT RUNTIME INVESTIGATION"
Write-Host "========================================================================"
Write-Host ""

Write-Host "OBSERVATION FROM BACKEND LOGS:"
Write-Host "❌ API requests ARE reaching security layer"
Write-Host "❌ But being rejected with 403 (Unauthorized)"
Write-Host "❌ Authentication token missing"
Write-Host ""

Write-Host "This means:"
Write-Host "1. The Frontend IS making HTTP requests to the backend"
Write-Host "2. But they're unauthenticated"
Write-Host "3. Our new logging in controllers is NOT executing because auth fails first"
Write-Host ""

Write-Host "NEXT INVESTIGATION:"
Write-Host "We need to open the app in browser, login, then check:"
Write-Host "1. Browser Console logs (search for our [Dashboard] messages)"
Write-Host "2. Network tab (look for actual API requests with auth)"
Write-Host "3. Redux state (currentWorkspace value)"
Write-Host "4. React Query enabled condition"
Write-Host ""

Write-Host "CRITICAL FINDING:"
Write-Host "If the requests are being made with proper auth, but showing 0 data,"
Write-Host "then the data is disappearing at a different layer."
Write-Host ""

Write-Host "Testing with authenticated session..."
Write-Host "First, get auth token by logging in manually..."
Write-Host ""

Write-Host "Open browser to http://localhost:3000 and:"
Write-Host "1. Login with your test account"
Write-Host "2. Open DevTools Console (F12)"
Write-Host "3. Look for console logs starting with:"
Write-Host "   - [Dashboard] currentWorkspace changed:"
Write-Host "   - [Dashboard Query] queryFn executing!"
Write-Host "   - [analyticsService.getDashboard]"
Write-Host ""
Write-Host "4. Open Network tab and navigate to /dashboard"
Write-Host "5. Look for GET /api/dashboard/overview"
Write-Host "6. Check Response tab for data"
Write-Host ""

Write-Host "Report location: c:\Users\arjun\OneDrive\Desktop\Task Manager and Chat Application\runtime-investigation-report.txt"

