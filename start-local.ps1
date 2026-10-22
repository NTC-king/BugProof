$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
  $node = (Get-Command node -ErrorAction Stop).Source
  $major = [int]((& $node --version) -replace '^v(\d+)\..*$', '$1')
  if ($major -lt 24) { throw 'BugProof needs Node.js 24 or later.' }
  if (!(Test-Path -LiteralPath 'node_modules\vite\bin\vite.js')) { throw 'Dependencies are missing. Run .\install-local.ps1 first.' }
  & $node 'node_modules\typescript\bin\tsc' --noEmit
  if ($LASTEXITCODE -ne 0) { throw 'Type checking failed.' }
  & $node 'node_modules\vite\bin\vite.js' build
  if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
  & $node --env-file-if-exists=.env 'server/main.mjs'
  if ($LASTEXITCODE -ne 0) { throw 'The local server stopped with an error. Check ports 4100/4101 and the message above; do not stop an unknown process.' }
} finally { Pop-Location }
