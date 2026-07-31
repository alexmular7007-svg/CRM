@echo off
cd /d "%~dp0"
mvn exec:java "-Dexec.mainClass=com.arjun.crm.util.DatabaseDiagnostics"
