[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
$certDir = Join-Path $root ".local-certs"
$cert = Join-Path $certDir "localhost.pem"
$key = Join-Path $certDir "localhost-key.pem"

if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
  throw "mkcert is required. Install it, then rerun this script. Do not bypass browser TLS validation."
}

& mkcert -install
if ($LASTEXITCODE -ne 0) { throw "mkcert trust installation failed." }

if ((Test-Path -LiteralPath $cert) -and (Test-Path -LiteralPath $key)) {
  Write-Host "Local HTTPS certificate already exists."
  exit 0
}

if ((Test-Path -LiteralPath $cert) -or (Test-Path -LiteralPath $key)) {
  throw "Only one local certificate file exists. Review .local-certs before regenerating."
}

New-Item -ItemType Directory -Path $certDir -Force | Out-Null
& mkcert -cert-file $cert -key-file $key localhost 127.0.0.1 ::1
if ($LASTEXITCODE -ne 0) { throw "mkcert certificate generation failed." }
Write-Host "Local HTTPS certificate is ready in ignored .local-certs."
