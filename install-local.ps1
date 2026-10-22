$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
  $node = (Get-Command node -ErrorAction Stop).Source
  $npm = Join-Path (Split-Path -Parent $node) 'node_modules\npm\bin\npm-cli.js'
  if (!(Test-Path -LiteralPath $npm)) { throw 'The Node installation does not include npm. Install a supported Node distribution.' }
  New-Item -ItemType Directory -Path '.cache\tmp' -Force | Out-Null
  $env:TEMP = Join-Path $PSScriptRoot '.cache\tmp'
  $env:TMP = $env:TEMP
  $env:npm_config_cache = Join-Path $PSScriptRoot '.cache\npm'
  $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
  & $node $npm ci --no-fund --no-audit
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
} finally { Pop-Location }
