[CmdletBinding()]
param([switch]$FreeTierConfirmed)
$ErrorActionPreference = 'Stop'
if (!$FreeTierConfirmed) {
  throw 'Confirm the locally configured replacement key belongs to a Free Tier project with billing off before using -FreeTierConfirmed.'
}
Push-Location -LiteralPath $PSScriptRoot
try {
  $node = (Get-Command node -ErrorAction Stop).Source
  & $node --env-file=.env 'tests/live-repair.mjs' --allow-live --free-tier-confirmed
  if ($LASTEXITCODE -ne 0) { throw 'Live test did not complete successfully. No automatic retry was made; inspect artifacts/live/summary.json.' }
} finally { Pop-Location }
