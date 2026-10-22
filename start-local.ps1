$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
  $node = (Get-Command node -ErrorAction Stop).Source
  if (!(Test-Path -LiteralPath 'node_modules\vite\bin\vite.js')) { throw 'Dependencies are missing. Run .\install-local.ps1 first.' }
  & $node 'node_modules\typescript\bin\tsc' --noEmit
  if ($LASTEXITCODE -ne 0) { throw 'Type checking failed.' }
  & $node 'node_modules\vite\bin\vite.js' build
  if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
  & $node --env-file-if-exists=.env 'server/main.mjs'
} finally { Pop-Location }
