@echo off
rem Removes what the first Last Colony installer put on this computer:
rem   the game in %LOCALAPPDATA%\Programs\Last Colony, its Start menu and desktop shortcuts, and its Installed apps entry.
rem Your saves (in %APPDATA%\Last Colony) are not touched.
setlocal
set "GAME=%LOCALAPPDATA%\Programs\Last Colony"
echo This removes Last Colony from:
echo   %GAME%
echo with its shortcuts and its Installed apps entry. Your saves are kept.
choice /m "Remove it"
if errorlevel 2 (echo Nothing removed. & pause & exit /b 0)

tasklist /fi "imagename eq Last Colony.exe" 2>nul | find /i "Last Colony.exe" >nul && (echo Last Colony is running. Close it, then run this again. & pause & exit /b 1)

powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$p=[Environment]::GetFolderPath('Programs');$d=[Environment]::GetFolderPath('Desktop');foreach($f in @((Join-Path $p 'Last Colony.lnk'),(Join-Path $d 'Last Colony.lnk'),(Join-Path $p 'Update Last Colony.lnk'),(Join-Path $p 'Uninstall Last Colony.lnk'))){if(Test-Path -LiteralPath $f){Remove-Item -LiteralPath $f; Write-Host ('Removed ' + $f)}}"

reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\LastColony" >nul 2>&1 && (reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\LastColony" /f >nul && echo Removed the Installed apps entry.)

if exist "%GAME%" (
  rmdir /s /q "%GAME%"
  if exist "%GAME%" (echo Some files in %GAME% could not be removed. Close the game and the updater, then run this again.) else (echo Removed %GAME%)
) else (
  echo The game folder was not there.
)
for /d %%D in ("%LOCALAPPDATA%\Programs\.lastcolony-install-*") do rmdir /s /q "%%D"

echo Done.
pause
