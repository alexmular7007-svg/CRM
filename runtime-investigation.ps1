
# Runtime Investigation Script - API Testing + Log Analysis
$ErrorActionPreference = "SilentlyContinue"

$report = @()

function Log($msg) {
    Write-Host $msg
    $script:report += $msg
}

Log ""
Log "========================================================================"
Log "           RUNTIME INVESTIGATION - API & LOG ANALYSIS"
Log "========================================================================"
Log ""

# ─────────────────────────────────────────────────────────────
# HELPER: Get workspace ID from first API call
# ─────────────────────────────────────────────────────────────
$workspaceId = 1

Log "STEP 1: Testing API endpoints..."
Log "Using workspace ID: $workspaceId"
Log ""

# ─────────────────────────────────────────────────────────────
# TEST 1: Dashboard API
# ─────────────────────────────────────────────────────────────
Log "========================================================================"
Log "TEST 1: DASHBOARD API"
Log "========================================================================"
Log ""

Log "Request: GET /api/dashboard/overview?workspaceId=$workspaceId"
try {
    $dashboardResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/dashboard/overview?workspaceId=$workspaceId" `
        -Method GET `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    Log "SUCCESS: HTTP Status 200"
    Log "Response structure:"
    $dashboardStr = $dashboardResponse | ConvertTo-Json -Depth 3
    Log $dashboardStr
    Log ""
} catch {
    Log "ERROR: $($_.Exception.Message)"
    Log ""
}

# ─────────────────────────────────────────────────────────────
# TEST 2: Lead Magnets API
# ─────────────────────────────────────────────────────────────
Log "========================================================================"
Log "TEST 2: LEAD MAGNETS API"
Log "========================================================================"
Log ""

Log "Request: GET /api/workspaces/$workspaceId/lead-magnets"
try {
    $leadMagnetsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/workspaces/$workspaceId/lead-magnets" `
        -Method GET `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    Log "SUCCESS: HTTP Status 200"
    Log "Response structure:"
    $leadStr = $leadMagnetsResponse | ConvertTo-Json -Depth 3
    Log $leadStr
    Log ""
} catch {
    Log "ERROR: $($_.Exception.Message)"
    Log ""
}

# ─────────────────────────────────────────────────────────────
# TEST 3: Email Campaigns API
# ─────────────────────────────────────────────────────────────
Log "========================================================================"
Log "TEST 3: EMAIL CAMPAIGNS API"
Log "========================================================================"
Log ""

Log "Request: GET /api/workspaces/$workspaceId/email-campaigns"
try {
    $emailCampaignsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/workspaces/$workspaceId/email-campaigns" `
        -Method GET `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    Log "SUCCESS: HTTP Status 200"
    Log "Response structure:"
    $emailStr = $emailCampaignsResponse | ConvertTo-Json -Depth 3
    Log $emailStr
    Log ""
} catch {
    Log "ERROR: $($_.Exception.Message)"
    Log ""
}

# ─────────────────────────────────────────────────────────────
# BACKEND LOGS Analysis
# ─────────────────────────────────────────────────────────────
Log "========================================================================"
Log "BACKEND LOGS - Recent entries"
Log "========================================================================"
Log ""

$logPath = "c:\Users\arjun\OneDrive\Desktop\Task Manager and Chat Application\crm-backend\logs\crm-backend.log"

if (Test-Path $logPath) {
    Log "Retrieving logs from: $logPath"
    Log ""
    $recentLogs = Get-Content $logPath | Select-Object -Last 200
    $recentLogs | ForEach-Object {
        if ($_ -match "Dashboard|lead-magnet|email-campaign|Controller|ServiceImpl") {
            Log $_
        }
    }
} else {
    Log "WARNING: Backend logs not found at: $logPath"
    Log "Check the terminal where backend is running for live logs"
}

Log ""
Log "========================================================================"
Log "INVESTIGATION COMPLETE"
Log "========================================================================"
Log ""

# Write report to file
$reportPath = "c:\Users\arjun\OneDrive\Desktop\Task Manager and Chat Application\runtime-investigation-report.txt"
$report | Out-File $reportPath -Encoding UTF8
Log "Report saved to: $reportPath"

