# Bootstrap script — run once on a new cluster before `make up`
# Installs: Argo Rollouts, NGINX Ingress Controller, Kubernetes Dashboard

param(
    [switch]$SkipIngress,
    [switch]$SkipDashboard,
    [switch]$SkipArgo
)

$ErrorActionPreference = "Stop"

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
    kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
    Wait-Rollout "argo-rollouts" "argo-rollouts"
    Write-Host "  Argo Rollouts ready"
}

# ── 3. Kubernetes Dashboard ──────────────────────────────────────────────────
if (-not $SkipDashboard) {
    Write-Host "`n[3/3] Installing Kubernetes Dashboard..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

    # Expose as NodePort on 30443
    kubectl patch svc kubernetes-dashboard -n kubernetes-dashboard `
        --type=json `
        -p='[{"op":"replace","path":"/spec/type","value":"NodePort"}]' 2>$null

    kubectl apply -f - <<EOF
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
EOF

    # Create admin service account
    kubectl apply -f - <<EOF
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
EOF
    Write-Host "  Dashboard ready at https://localhost:30443"
    Write-Host "  Get token: kubectl -n kubernetes-dashboard create token admin-user"
}

Write-Host "`n Bootstrap complete. Now run: make up"
