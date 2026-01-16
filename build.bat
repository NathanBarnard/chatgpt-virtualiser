@echo off
setlocal

set ZIP_NAME=chatgpt-virtualiser.zip

:: Clean previous build
if exist "%ZIP_NAME%" del "%ZIP_NAME%"

:: Create zip using PowerShell
powershell -Command "Compress-Archive -Path manifest.json,src,icons,README.md -DestinationPath '%ZIP_NAME%'"

echo Built: %ZIP_NAME%
