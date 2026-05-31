# Local workflow — everything runs in Kubernetes (minikube / Docker Desktop).
#
# Most days:
#   make up
#   make status
#   make logs
#   make down
#
# Grafana:    http://localhost:30300
# Prometheus: http://localhost:30900
# K8s Dashboard: https://localhost:30443

IMAGE_TAG ?= latest
NAMESPACE      := microservices
OBS_NAMESPACE  := observability

.PHONY: help up down obs-up obs-down build push deploy ingress health status logs bootstrap

help:
	@echo "Targets:"
	@echo "  make up       - deploy observability + build/push images + deploy app + ingress"
	@echo "  make down     - delete app and observability from Kubernetes"
	@echo "  make status   - show pods/services in both namespaces"
	@echo "  make health   - run health checks"
	@echo "  make logs     - tail app logs"
	@echo ""
	@echo "Step-by-step:"
	@echo "  make obs-up   - deploy observability stack into K8s"
	@echo "  make obs-down - delete observability from K8s"
	@echo "  make build    - build all service images"
	@echo "  make push     - push all service images"
	@echo "  make deploy   - apply Kubernetes manifests and update images"
	@echo "  make ingress  - apply API gateway ingress"
	@echo ""
	@echo "Access (no port-forward needed):"
	@echo "  Grafana:            http://localhost:30300"
	@echo "  Prometheus:         http://localhost:30900"
	@echo "  K8s Dashboard:      https://localhost:30443"
	@echo "  APIs:               http://api.myorg.com"
	@echo ""
	@echo "Variables:"
	@echo "  IMAGE_TAG=$(IMAGE_TAG)"

# ── Bootstrap (run once on new cluster) ─────────────────────────────────────
bootstrap:
	powershell -NoProfile -ExecutionPolicy Bypass -File scripts/bootstrap.ps1

# ── Full stack up ────────────────────────────────────────────────────────────
up: obs-up build push deploy ingress

# ── Full stack down ──────────────────────────────────────────────────────────
down:
	kubectl delete -n $(NAMESPACE) -f ms-api-gateway/k8/apigateway-ingress.yaml --ignore-not-found=true
	kubectl delete -k . --ignore-not-found=true
	kubectl delete namespace $(NAMESPACE)    --ignore-not-found=true
	kubectl delete namespace $(OBS_NAMESPACE) --ignore-not-found=true

# ── Observability (K8s) ──────────────────────────────────────────────────────
obs-up:
	kubectl apply -k observability/k8
	kubectl rollout status deployment/loki       -n $(OBS_NAMESPACE) --timeout=120s
	kubectl rollout status deployment/tempo      -n $(OBS_NAMESPACE) --timeout=120s
	kubectl rollout status deployment/prometheus -n $(OBS_NAMESPACE) --timeout=120s
	kubectl rollout status deployment/grafana    -n $(OBS_NAMESPACE) --timeout=120s
	kubectl rollout status daemonset/alloy       -n $(OBS_NAMESPACE) --timeout=120s

obs-down:
	kubectl delete -k observability/k8 --ignore-not-found=true
	kubectl delete namespace $(OBS_NAMESPACE) --ignore-not-found=true

# ── Build images ─────────────────────────────────────────────────────────────
build:
	docker build -t dayasahu6077/configserver:$(IMAGE_TAG) configserver
	docker build -t dayasahu6077/employee:$(IMAGE_TAG)     employee
	docker build -t dayasahu6077/department:$(IMAGE_TAG)   department
	docker build -t dayasahu6077/ms-api-gateway:$(IMAGE_TAG) ms-api-gateway
	docker build -t dayasahu6077/auth-service:$(IMAGE_TAG) auth-service

# ── Push images ──────────────────────────────────────────────────────────────
push:
	docker push dayasahu6077/configserver:$(IMAGE_TAG)
	docker push dayasahu6077/employee:$(IMAGE_TAG)
	docker push dayasahu6077/department:$(IMAGE_TAG)
	docker push dayasahu6077/ms-api-gateway:$(IMAGE_TAG)
	docker push dayasahu6077/auth-service:$(IMAGE_TAG)

# ── Deploy microservices ─────────────────────────────────────────────────────
deploy:
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -k .
	# Deployments — standard set image
	kubectl -n $(NAMESPACE) set image deployment/configserver  configserver=dayasahu6077/configserver:$(IMAGE_TAG)
	kubectl -n $(NAMESPACE) set image deployment/apigateway    apigateway=dayasahu6077/ms-api-gateway:$(IMAGE_TAG)
	kubectl -n $(NAMESPACE) set image deployment/auth-service  auth-service=dayasahu6077/auth-service:$(IMAGE_TAG)
	# Argo Rollouts (employee, department) — use the rollouts plugin
	kubectl argo rollouts -n $(NAMESPACE) set image employee   employee=dayasahu6077/employee:$(IMAGE_TAG)
	kubectl argo rollouts -n $(NAMESPACE) set image department department=dayasahu6077/department:$(IMAGE_TAG)
	# Wait for Deployments
	kubectl -n $(NAMESPACE) rollout status deployment/configserver --timeout=180s
	kubectl -n $(NAMESPACE) rollout status deployment/apigateway   --timeout=180s
	kubectl -n $(NAMESPACE) rollout status deployment/auth-service --timeout=180s
	# Wait for Rollouts
	kubectl argo rollouts -n $(NAMESPACE) status employee   --timeout=180s
	kubectl argo rollouts -n $(NAMESPACE) status department --timeout=180s

# ── Ingress ──────────────────────────────────────────────────────────────────
ingress:
	kubectl apply -n $(NAMESPACE) -f ms-api-gateway/k8/apigateway-ingress.yaml

# ── Status ───────────────────────────────────────────────────────────────────
status:
	@echo "=== Microservices ==="
	kubectl -n $(NAMESPACE) get pods,svc,ingress
	@echo ""
	@echo "=== Observability ==="
	kubectl -n $(OBS_NAMESPACE) get pods,svc

# ── Health checks ────────────────────────────────────────────────────────────
health:
	powershell -NoProfile -ExecutionPolicy Bypass -File scripts/health-check.ps1 -Namespace $(NAMESPACE)

# ── Logs ─────────────────────────────────────────────────────────────────────
logs:
	kubectl -n $(NAMESPACE) logs -f --tail=100 -l app.kubernetes.io/part-of=microservices-training --all-containers=true
