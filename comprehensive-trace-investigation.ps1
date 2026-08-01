
# Comprehensive Trace Investigation - Making authenticated requests and monitoring logs
$ErrorActionPreference = "Continue"

$report = @()

function Log($msg) {
    Write-Host $msg
    $script:report += $msg
}

Log ""
Log "=================================================================="
Log "COMPREHENSIVE TRACE INVESTIGATION - AUTHENTICATED API CALLS"
Log "=================================================================="
Log ""

# Step 1: Login to get JWT token
Log "[STEP 1] Getting JWT Token..."
Log "Email: test1@example.com"
Log "Password: password123"
Log ""

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body (ConvertTo-Json @{
            email = "test1@example.com"
            password = "password123"
        }) `
        -TimeoutSec 10
    
    $jwtToken = if ($loginResponse.data -ne $null) { $loginResponse.data.token } else { $loginResponse.token }
    $workspaceId = 1  # Marketing Team workspace owned by test1
    
    if (-not $jwtToken) {
        Log "ERROR: Token not found in response"
        Log "Response: $($loginResponse | ConvertTo-Json)"
        exit 1
    }
    
    Log "SUCCESS: JWT Token obtained"
    Log "Token (first 50 chars): $($jwtToken.Substring(0,50))..."
    Log "Workspace ID to use: $workspaceId"
    Log ""
} catch {
    Log "ERROR: Login failed: $($_.Exception.Message)"
    exit 1
}

# Create auth header
$authHeader = @{"Authorization" = "Bearer $jwtToken"; "Content-Type" = "application/json"}

# ─────────────────────────────────────────────────────────────
# TEST 1: DASHBOARD
# ─────────────────────────────────────────────────────────────
Log "=================================================================="
Log "[TEST 1] DASHBOARD API - GET /api/dashboard/overview?workspaceId=$workspaceId"
Log "=================================================================="
Log ""

try {
    $dashboardResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/dashboard/overview?workspaceId=$workspaceId" `
        -Method GET `
        -Headers $authHeader `
        -TimeoutSec 10
    
    Log "SUCCESS: HTTP 200"
    Log "Response data:"
    Log "  - Total Tasks: $($dashboardResponse.data.taskStatistics.totalTasks)"
    Log "  - Completed Tasks: $($dashboardResponse.data.taskStatistics.completedTasks)"
    Log "  - In Progress: $($dashboardResponse.data.taskStatistics.inProgressTasks)"
    Log "  - Overdue: $($dashboardResponse.data.taskStatistics.overdueTasks)"
    Log ""
} catch {
    Log "ERROR: $($_.Exception.Message)"
    Log ""
}

# ─────────────────────────────────────────────────────────────
# TEST 2: LEAD MAGNETS
# ─────────────────────────────────────────────────────────────
Log "=================================================================="
Log "[TEST 2] LEAD MAGNETS API - GET /api/workspaces/$workspaceId/lead-magnets"
Log "=================================================================="
Log ""

try {
    $leadResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/workspaces/$workspaceId/lead-magnets" `
        -Method GET `
        -Headers $authHeader `
        -TimeoutSec 10
    
    Log "SUCCESS: HTTP 200"
    Log "Response data:"
    Log "  - Total Elements: $($leadResponse.data.totalElements)"
    Log "  - Page Size: $($leadResponse.data.size)"
    Log "  - Total Pages: $($leadResponse.data.totalPages)"
    if ($leadResponse.data.content) {
        Log "  - Content Items: $($leadResponse.data.content.Count)"
        if ($leadResponse.data.content.Count -gt 0) {
            Log "  - First Item: $($leadResponse.data.content[0].name)"
        }
    }
    Log ""
} catch {
    Log "ERROR: $($_.Exception.Message)"
    Log ""
}

# ─────────────────────────────────────────────────────────────
# TEST 3: EMAIL CAMPAIGNS
# ─────────────────────────────────────────────────────────────
Log "=================================================================="
Log "[TEST 3] EMAIL CAMPAIGNS API - GET /api/workspaces/$workspaceId/email-campaigns"
Log "=================================================================="
Log ""

try {
    $emailResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/workspaces/$workspaceId/email-campaigns" `
        -Method GET `
        -Headers $authHeader `
        -TimeoutSec 10
    
    Log "SUCCESS: HTTP 200"
    Log "Response data:"
    Log "  - Total Elements: $($emailResponse.data.totalElements)"
    Log "  - Page Size: $($emailResponse.data.size)"
    Log "  - Total Pages: $($emailResponse.data.totalPages)"
    if ($emailResponse.data.content) {
        Log "  - Content Items: $($emailResponse.data.content.Count)"
        if ($emailResponse.data.content.Count -gt 0) {
            Log "  - First Item: $($emailResponse.data.content[0].name)"
        }
    }
    Log ""
} catch {
    Log "ERROR: $($_.Exception.Message)"
    Log ""
}

# ─────────────────────────────────────────────────────────────
# BACKEND LOGS - Capture relevant entries
# ─────────────────────────────────────────────────────────────
Log "=================================================================="
Log "[BACKEND LOGS] - Recent 300 lines (filtered for TRACE)"
Log "=================================================================="
Log ""

$logPath = "c:\Users\arjun\OneDrive\Desktop\Task Manager and Chat Application\crm-backend\logs\crm-backend.log"

if (Test-Path $logPath) {
    $recentLogs = Get-Content $logPath | Select-Object -Last 300
    $foundTraces = $false
    
    $recentLogs | ForEach-Object {
        if ($_ -match "TRACE|Hibernate:|total_elements|mapped_elements|totalTasks|completedTasks") {
            Log $_
            $foundTraces = $true
        }
    }
    
    if (-not $foundTraces) {
        Log "No TRACE logs found in recent 300 lines"
        Log "Showing last 50 lines:"
        $recentLogs | Select-Object -Last 50 | ForEach-Object { Log $_ }
    }
} else {
    Log "Backend logs not found at: $logPath"
}

Log ""
Log "=================================================================="
Log "INVESTIGATION COMPLETE"
Log "=================================================================="
Log ""

# Write to file
$reportPath = "c:\Users\arjun\OneDrive\Desktop\Task Manager and Chat Application\trace-investigation-results.txt"
$report | Out-File $reportPath -Encoding UTF8
Log "Report saved to: $reportPath"

