@echo off
REM Start CRM Backend with SMTP Configuration
REM This script loads .env variables and starts the Spring Boot application

REM Load environment variables from .env
FOR /F "tokens=*" %%a in (
    'findstr /r "^[A-Z_]*=" .env'
) do (
    set "%%a"
)

REM Display SMTP Configuration (masked password)
echo ════════════════════════════════════════════════════════════════
echo SMTP Configuration Loaded:
echo ════════════════════════════════════════════════════════════════
echo Email From: %MAIL_USERNAME%
echo SMTP Host: smtp.gmail.com
echo SMTP Port: 587
echo TLS: Enabled
echo ════════════════════════════════════════════════════════════════
echo.

REM Start the Spring Boot application with environment variables
java -jar target\crm-backend-0.0.1-SNAPSHOT.jar ^
  -DMAIL_USERNAME=%MAIL_USERNAME% ^
  -DMAIL_PASSWORD=%MAIL_PASSWORD% ^
  -DSPRING_PROFILES_ACTIVE=%SPRING_PROFILES_ACTIVE%

REM If Java command fails, show error message
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start backend
    echo Check that:
    echo   1. Java is installed and in PATH
    echo   2. .env file exists with MAIL_USERNAME and MAIL_PASSWORD
    echo   3. target/crm-backend-0.0.1-SNAPSHOT.jar exists (run: mvn clean package)
    pause
)
