@echo off
REM ---------------------------------------------------------------------------
REM  Refresh the gallery after adding or removing photos.
REM  1. Drop your new images into images\indoor, images\terrace or images\beach
REM     using the next number (e.g. indoor40.jpg).
REM  2. Double-click this file.
REM ---------------------------------------------------------------------------
cd /d "%~dp0"
node tools\build-manifest.js
echo.
pause
