# Health check for the microservices namespace.
# Usage: powershell -File scripts/health-check.ps1 -Namespace microservices

param(
    [string]$Namespace = "microservices"
)

$ErrorActionPreference = "Continue"
$fail = 0

function Section($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }

Section "Pods in $Namespace"
kubectl get pods -n $Namespace -o wide

Section "Pod readiness"
$pods = kubectl get pods -n $Namespace -o json | ConvertFrom-Json
foreach ($p in $pods.items) {
    $name  = $p.metadata.name
    $ready = ($p.status.containerStatuses | Where-Object { $_.ready }).Count
    $total = $p.status.containerStatuses.Count
    $phase = $p.status.phase
    if ($phase -eq "Running" -and $ready -eq $total) {
        Write-Host ("  [OK]   {0}  ({1}/{2})" -f $name, $ready, $total) -ForegroundColor Green
    } else {
        Write-Host ("  [WARN] {0}  ({1}/{2})  phase={3}" -f $name, $ready, $total, $phase) -ForegroundColor Yellow
        $fail++
    }
}

Section "Service endpoints (must not be empty)"
foreach ($svc in "employee","department","apigateway","auth-service","configserver") {
    $eps = kubectl get endpoints $svc -n $Namespace -o jsonpath="{.subsets[*].addresses[*].ip}" 2>$null
    if ($eps) {
        Write-Host ("  [OK]   {0} -> {1}" -f $svc, $eps) -ForegroundColor Green
    } else {
        Write-Host ("  [FAIL] {0} has no endpoints" -f $svc) -ForegroundColor Red
        $fail++
    }
}

Section "Argo Rollouts"
kubectl argo rollouts list rollouts -n $Namespace 2>$null

Write-Host ""
if ($fail -eq 0) {
    Write-Host "All health checks passed." -ForegroundColor Green
    exit 0
} else {
    Write-Host "$fail check(s) need attention." -ForegroundColor Yellow
    exit 1
}
