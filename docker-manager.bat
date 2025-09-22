@echo off
REM SimpleIT Docker Manager Batch Wrapper
REM This allows you to run the PowerShell script more easily

if "%1"=="" (
    powershell -ExecutionPolicy Bypass -File "%~dp0docker-manager.ps1" help
) else (
    powershell -ExecutionPolicy Bypass -File "%~dp0docker-manager.ps1" %*
)