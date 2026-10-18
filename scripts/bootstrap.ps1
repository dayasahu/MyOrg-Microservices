# Bootstrap script — run once on a new cluster before `make up`
# Installs: Argo Rollouts, NGINX Ingress Controller, Kubernetes Dashboard

param(
    [switch]$SkipIngress,
    [switch]$SkipDashboard,
    [switch]$SkipArgo
)

$ErrorActionPreference = "Stop"

# "Stop" doesn't catch native-command failures in Windows PowerShell 5.1, so a failed
# kubectl would scroll past and the script would still report success. Fail fast instead.
function kubectl {
    $input | & kubectl.exe @args
    if ($LASTEXITCODE -ne 0) { throw "kubectl $args failed (exit code $LASTEXITCODE)" }
}

function Wait-Rollout($namespace, $deployment, $timeout = "120s") {
    Write-Host "  Waiting for $deployment..."
    kubectl rollout status deployment/$deployment -n $namespace --timeout=$timeout
}

# ── 1. NGINX Ingress Controller ──────────────────────────────────────────────
if (-not $SkipIngress) {
    Write-Host "`n[1/3] Installing NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
    Write-Host "  Waiting for ingress controller..."
    kubectl wait --namespace ingress-nginx `
        --for=condition=ready pod `
        --selector=app.kubernetes.io/component=controller `
        --timeout=120s
    Write-Host "  NGINX Ingress ready"
}

# ── 2. Argo Rollouts ─────────────────────────────────────────────────────────
if (-not $SkipArgo) {
    Write-Host "`n[2/3] Installing Argo Rollouts..."
    kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -
    # --server-side: the Rollout/AnalysisRun CRDs exceed the 256KB last-applied annotation limit of client-side apply
    kubectl apply --server-side -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
    Wait-Rollout "argo-rollouts" "argo-rollouts"
    Write-Host "  Argo Rollouts ready"
}

# ── 3. Kubernetes Dashboard ──────────────────────────────────────────────────
if (-not $SkipDashboard) {
    Write-Host "`n[3/3] Installing Kubernetes Dashboard..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

    # Expose as NodePort on 30443
    # PowerShell here-strings piped to kubectl (bash <<EOF heredocs don't parse in PowerShell)
    @"
apiVersion: v1
kind: Service
metadata:
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
  labels:
    k8s-app: kubernetes-dashboard
spec:
  type: NodePort
  ports:
    - port: 443
      targetPort: 8443
      nodePort: 30443
  selector:
    k8s-app: kubernetes-dashboard
"@ | kubectl apply -f -

    # Expose via nginx ingress at https://dashboard.myorg.com
    kubectl apply -f (Join-Path $PSScriptRoot "..\observability\k8\dashboard-ingress.yaml")

    # Create admin service account
    @"
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: admin-user
    namespace: kubernetes-dashboard
"@ | kubectl apply -f -
    Write-Host "  Dashboard ready at https://localhost:30443"
    Write-Host "  Get token: kubectl -n kubernetes-dashboard create token admin-user"
}

Write-Host "`n Bootstrap complete. Now run: make up"
