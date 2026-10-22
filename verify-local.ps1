[CmdletBinding()]
param([switch]$Evaluate)

$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
  $node = (Get-Command node -ErrorAction Stop).Source
  if (!(Test-Path -LiteralPath 'node_modules\vite\bin\vite.js')) {
    throw 'Dependencies are missing. Run .\install-local.ps1 first.'
  }
  & $node 'node_modules\typescript\bin\tsc' --noEmit
  if ($LASTEXITCODE -ne 0) { throw 'Type checking failed.' }
  & $node 'node_modules\vite\bin\vite.js' build
  if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
  & $node --test 'tests/*.test.mjs'
  if ($LASTEXITCODE -ne 0) { throw 'Unit/server tests failed.' }
  if ($Evaluate) { & $node 'tests/browser.mjs' --evaluate }
  else { & $node 'tests/browser.mjs' }
  if ($LASTEXITCODE -ne 0) { throw 'Browser verification failed. Read the first reported failure.' }
  Write-Host 'Verification passed. No real model request was made by this test suite.'
} finally { Pop-Location }
