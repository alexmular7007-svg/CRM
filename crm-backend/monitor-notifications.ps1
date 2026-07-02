# Real-time backend log monitor for notification errors
# Usage: .\monitor-notifications.ps1

$logFile = "c:\Users\arjun\OneDrive\Desktop\Task Manager and Chat Application\crm-backend\logs\crm-backend.log"

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  NOTIFICATION ENDPOINT ERROR MONITOR                         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring: $logFile" -ForegroundColor Yellow
Write-Host "Filter: NOTIFICATION, ERROR, Exception" -ForegroundColor Yellow
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Green
Write-Host "1. Open browser at http://localhost:3000" -ForegroundColor Green
Write-Host "2. Login to your workspace" -ForegroundColor Green
Write-Host "3. Open DevTools (F12) → Console" -ForegroundColor Green
Write-Host "4. Paste and run the fetch command" -ForegroundColor Green
Write-Host "5. Watch this window for the error" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Magenta
Write-Host ""

$lastChecked = 0

while ($true) {
    try {
        $content = @(Get-Content $logFile)
        $current = $content.Count
        
        if ($current -gt $lastChecked) {
            Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] New log lines detected: $($current - $lastChecked)" -ForegroundColor Green
            
            # Get the new lines
            $newLines = $content[$lastChecked..($current-1)]
            
            # Filter for relevant entries
            foreach ($line in $newLines) {
                if ($line -match "NOTIFICATION|ERROR|Exception|at com\.arjun") {
                    if ($line -match "ERROR") {
                        Write-Host $line -ForegroundColor Red
                    } elseif ($line -match "Exception") {
                        Write-Host $line -ForegroundColor Magenta
                    } elseif ($line -match "at com\.arjun") {
                        Write-Host $line -ForegroundColor Yellow
                    } else {
                        Write-Host $line -ForegroundColor Cyan
                    }
                }
            }
            
            $lastChecked = $current
        }
        
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Start-Sleep -Seconds 1
    }
}
