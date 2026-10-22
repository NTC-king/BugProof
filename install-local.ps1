$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'scripts\with-local-environment.ps1')
Push-Location -LiteralPath $PSScriptRoot
try {
  $node = (Get-Command node -ErrorAction Stop).Source
  $major = [int]((& $node --version) -replace '^v(\d+)\..*$', '$1')
  if ($major -lt 24) { throw 'BugProof needs Node.js 24 or later.' }
  $npm = Join-Path (Split-Path -Parent $node) 'node_modules\npm\bin\npm-cli.js'
  if (!(Test-Path -LiteralPath $npm)) { throw 'The Node installation does not include npm. Install a supported Node distribution.' }
  New-Item -ItemType Directory -Path '.cache\tmp' -Force | Out-Null
  Invoke-BugProofEnvironment -Values @{
    TEMP = (Join-Path $PSScriptRoot '.cache\tmp')
    TMP = (Join-Path $PSScriptRoot '.cache\tmp')
    npm_config_cache = (Join-Path $PSScriptRoot '.cache\npm')
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
  } -Action {
    & $node $npm ci --no-fund --no-audit
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
  }
} finally {
  Pop-Location
}
