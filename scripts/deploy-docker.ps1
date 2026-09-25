[CmdletBinding()]
param(
  [string]$EnvFile = ".env.local",
  [int]$StartupTimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Test-EnvValue {
  param(
    [Parameter(Mandatory)]
    [string]$Path,
    [Parameter(Mandatory)]
    [string]$Name
  )

  $match = Select-String -LiteralPath $Path -Pattern "^\s*$([regex]::Escape($Name))\s*=\s*(.+?)\s*$" | Select-Object -First 1
  if ($null -eq $match) {
    return $false
  }

  $value = $match.Matches[0].Groups[1].Value.Trim().Trim('"').Trim("'")
  return -not [string]::IsNullOrWhiteSpace($value)
}

function Wait-ForDocker {
  param([Parameter(Mandatory)][int]$TimeoutSeconds)

  & docker info --format "{{.ServerVersion}}" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    return
  }

  $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
  if (-not (Test-Path -LiteralPath $dockerDesktop)) {
    throw "Docker Desktop is not running and was not found at '$dockerDesktop'. Start a Docker engine and run this script again."
  }

  Write-Host "Starting Docker Desktop..."
  Start-Process -FilePath $dockerDesktop -WindowStyle Hidden

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    Start-Sleep -Seconds 2
    & docker info --format "{{.ServerVersion}}" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      return
    }
  } while ((Get-Date) -lt $deadline)

  throw "Docker engine did not become ready within $TimeoutSeconds seconds."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedEnvFile = Join-Path $projectRoot $EnvFile

if (-not (Test-Path -LiteralPath $resolvedEnvFile -PathType Leaf)) {
  throw "Environment file not found: $resolvedEnvFile. Copy .env.example to .env.local and set its values."
}

foreach ($name in "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  if (-not (Test-EnvValue -Path $resolvedEnvFile -Name $name)) {
    throw "Required value '$name' is missing or blank in $resolvedEnvFile."
  }
}

$supabaseUrl = (Select-String -LiteralPath $resolvedEnvFile -Pattern '^\s*NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+?)\s*$' | Select-Object -First 1).Matches[0].Groups[1].Value.Trim().Trim('"').Trim("'")
if ($supabaseUrl -ne "https://localhost") {
  throw "Local Docker HTTPS requires NEXT_PUBLIC_SUPABASE_URL=https://localhost. Refusing a hosted or insecure Supabase URL."
}
foreach ($certName in "localhost.pem", "localhost-key.pem") {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot ".local-certs/$certName") -PathType Leaf)) {
    throw "Local TLS certificate missing. Run scripts/setup-local-https.ps1 first."
  }
}

Push-Location $projectRoot
try {
  Wait-ForDocker -TimeoutSeconds $StartupTimeoutSeconds

  & docker compose --env-file $resolvedEnvFile config --quiet
  if ($LASTEXITCODE -ne 0) { throw "Docker Compose configuration validation failed." }

  & docker compose --env-file $resolvedEnvFile up --build --detach --remove-orphans
  if ($LASTEXITCODE -ne 0) { throw "Docker Compose deployment failed." }

  $deadline = (Get-Date).AddSeconds(30)
  do {
    try {
      $response = Invoke-WebRequest -Uri "https://localhost/api/health" -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq 200) {
        & docker compose --env-file $resolvedEnvFile ps
        Write-Host "Lang Suan is ready at https://localhost"
        exit 0
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  } while ((Get-Date) -lt $deadline)

  & docker compose --env-file $resolvedEnvFile logs --tail 100 web https-proxy
  throw "The containers started, but https://localhost/api/health did not return HTTP 200 within 30 seconds."
} finally {
  Pop-Location
}
