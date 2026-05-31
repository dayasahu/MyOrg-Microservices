# Windows helper for the local observability stack.
#
# Docker Compose is used only for observability:
#   - Grafana
#   - Prometheus
#   - Loki
#   - Tempo
#   - OpenTelemetry Collector
#
# Microservices run in Kubernetes. Use the Makefile for the full workflow:
#   make up
#   make k8s-deploy IMAGE_TAG=v1.0.0
#
# Usage:
#   .\bootstrap.ps1         # start observability
#   .\bootstrap.ps1 -Down   # stop observability, keep volumes
#   .\bootstrap.ps1 -Nuke   # stop observability, delete volumes and network

[CmdletBinding()]
param(
    [switch]$Down,
    [switch]$Nuke
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

function Section($text) {
    Write-Host ""
    Write-Host "=== $text ===" -ForegroundColor Cyan
}

function Wait-Url($url, $name, $timeoutSec = 90) {
    Write-Host "Waiting for $name at $url ..." -NoNewline
    $deadline = (Get-Date).AddSeconds($timeoutSec)

    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                Write-Host " OK" -ForegroundColor Green
                return $true
            }
        } catch {}

        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }

    Write-Host " TIMEOUT" -ForegroundColor Red
    return $false
}

if ($Down -or $Nuke) {
    $volumeFlag = if ($Nuke) { "-v" } else { "" }

    Section "Stopping observability stack"
    docker compose -f observability/docker-compose.yml down $volumeFlag

    if ($Nuke) {
        Section "Removing observability network"
        docker network rm observability 2>$null
    }

    Write-Host "Done." -ForegroundColor Green
    return
}

Section "Checking prerequisites"
try {
    docker info | Out-Null
    Write-Host "Docker: OK" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Start Docker Desktop and re-run." -ForegroundColor Red
    exit 1
}

Section "Setting up observability network"
$networkExists = docker network ls --format "{{.Name}}" | Select-String -SimpleMatch "observability"
if ($networkExists) {
    Write-Host "Network 'observability' already exists." -ForegroundColor Yellow
} else {
    docker network create observability | Out-Null
    Write-Host "Created network 'observability'." -ForegroundColor Green
}

Section "Starting observability stack"
docker compose -f observability/docker-compose.yml up -d

$ok = $true
$ok = $ok -and (Wait-Url "http://localhost:13133" "OTel collector" 60)
$ok = $ok -and (Wait-Url "http://localhost:3100/ready" "Loki" 120)
$ok = $ok -and (Wait-Url "http://localhost:3200/ready" "Tempo" 60)
$ok = $ok -and (Wait-Url "http://localhost:9090/-/healthy" "Prometheus" 60)
$ok = $ok -and (Wait-Url "http://localhost:3000/api/health" "Grafana" 60)

if (-not $ok) {
    Write-Host "One or more observability components did not become ready." -ForegroundColor Red
    exit 2
}

Section "Observability is up"
Write-Host ""
Write-Host "  Grafana          http://localhost:3000   (anonymous Admin)"
Write-Host "  Prometheus       http://localhost:9090"
Write-Host "  Tempo            http://localhost:3200"
Write-Host "  Loki             http://localhost:3100"
Write-Host "  OTel Collector   http://localhost:13133  (health)"
Write-Host ""
Write-Host "Deploy microservices to Kubernetes with: make k8s-deploy" -ForegroundColor Green
