function Invoke-BugProofEnvironment {
  param([hashtable]$Values, [scriptblock]$Action)
  $previous = @{}
  foreach ($name in $Values.Keys) {
    $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
  }
  try {
    foreach ($name in $Values.Keys) {
      [Environment]::SetEnvironmentVariable($name, $Values[$name], 'Process')
    }
    & $Action
  } finally {
    foreach ($name in $previous.Keys) {
      [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process')
    }
  }
}
