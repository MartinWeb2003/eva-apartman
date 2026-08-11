@echo off
REM ---------------------------------------------------------------------------
REM  Rebuild the site after adding or removing photos.
REM
REM  1. Drop your new images into images\indoor, images\terrace or images\beach
REM     using the next number (e.g. indoor40.jpg).
REM  2. Double-click this file.
REM
REM  It runs the full build, which:
REM    - rescans the folders  (tools\build-manifest.js)
REM    - makes the WebP/resized versions of any new photo
REM                           (tools\optimize-images.js)
REM    - regenerates all 16 pages, in all four languages, with the new photos
REM      baked into the HTML, plus sitemap.xml
REM                           (tools\build-site.js)
REM
REM  Then commit and push as usual — Netlify publishes the files as they are.
REM ---------------------------------------------------------------------------
cd /d "%~dp0"

if not exist node_modules (
  echo Installing build dependencies, one moment...
  call npm install
  echo.
)

call npm run build
echo.
call npm run check
echo.
pause
