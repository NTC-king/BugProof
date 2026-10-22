$ErrorActionPreference = 'Stop'
. (Join-Path (Split-Path -Parent $PSScriptRoot) 'scripts\with-local-environment.ps1')
[Environment]::SetEnvironmentVariable('BUGPROOF_ENV_TEST_SET', 'before', 'Process')
[Environment]::SetEnvironmentVariable('BUGPROOF_ENV_TEST_UNSET', $null, 'Process')
foreach ($fail in @($false, $true)) {
  try {
    Invoke-BugProofEnvironment -Values @{ BUGPROOF_ENV_TEST_SET = 'temporary'; BUGPROOF_ENV_TEST_UNSET = 'temporary' } -Action {
      if ($env:BUGPROOF_ENV_TEST_SET -ne 'temporary' -or $env:BUGPROOF_ENV_TEST_UNSET -ne 'temporary') { throw 'Temporary environment was not applied.' }
      if ($fail) { throw 'Synthetic expected failure.' }
    }
  } catch {
    if (!$fail -or $_.Exception.Message -ne 'Synthetic expected failure.') { throw }
  }
  if ($env:BUGPROOF_ENV_TEST_SET -ne 'before' -or $null -ne [Environment]::GetEnvironmentVariable('BUGPROOF_ENV_TEST_UNSET', 'Process')) { throw 'Environment was not restored.' }
}
Write-Host 'Scoped environment restoration passed for success and failure.'
