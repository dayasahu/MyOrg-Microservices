# MyOrg-Project — Claude Context

## What This Project Is
Spring Boot microservices training project. Five services on Kubernetes with full LGTM observability stack.
Java 21, Spring Boot 3.5.x, Spring Cloud 2025.0.x.

## Quick Start
```bash
make up        # start everything
make down      # tear everything down
make status    # check pods/services
make logs      # tail all service logs
```

## Namespaces
| Namespace | Contains |
|---|---|
| `microservices` | employee, department, auth-service, ms-api-gateway, configserver |
| `observability` | otel-collector, loki, tempo, prometheus, grafana |
| `ingress-nginx` | nginx ingress controller |
| `kubernetes-dashboard` | K8s dashboard |

## Service Ports
| Service | Port | K8s DNS |
|---|---|---|
| employee | 8080 | employee.microservices.svc.cluster.local:80 |
| department | 8080 | department.microservices.svc.cluster.local:80 |
| auth-service | 9000 | auth-service.microservices.svc.cluster.local:9000 |
| ms-api-gateway | 8888 | apigateway.microservices.svc.cluster.local:80 |
| configserver | 8071 | configserver.microservices.svc.cluster.local:8071 |
| otel-collector | 4317/4318 | otel-collector.observability.svc.cluster.local |
| prometheus | 9090 | prometheus.observability.svc.cluster.local:9090 |
| grafana | 3000 | grafana.observability.svc.cluster.local:3000 |

## Ingress URLs (add to hosts file: 127.0.0.1 <domain>)
- http://api.myorg.com → apigateway
- http://grafana.myorg.com → grafana
- http://prometheus.myorg.com → prometheus
- https://dashboard.myorg.com → kubernetes-dashboard
- https://localhost:30443 → kubernetes-dashboard (NodePort)

## OTel Endpoints (used in all service deployments)
```
OTEL_TRACES_ENDPOINT:  http://otel-collector.observability.svc.cluster.local:4318/v1/traces
OTEL_METRICS_ENDPOINT: http://otel-collector.observability.svc.cluster.local:4318/v1/metrics
OTEL_LOGS_ENDPOINT:    http://otel-collector.observability.svc.cluster.local:4318/v1/logs
```

## Key Files
| File | Purpose |
|---|---|
| `kustomization.yaml` | Root — deploys microservices namespace |
| `observability/k8/kustomization.yaml` | Deploys observability namespace |
| `Makefile` | All workflow commands |
| `ms-api-gateway/k8/apigateway-ingress.yaml` | API ingress |
| `observability/k8/ingress.yaml` | Grafana/Prometheus ingress |
| `config-map-k8/` | ConfigMaps for each service (dev/prod overlays) |

## Blue-Green Deployment
- Uses Argo Rollouts (must be installed on cluster separately)
- Bootstrap: `kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml`
- employee and department use `rollout.yaml` (not `deployment.yaml`) for blue-green
- GitHub Actions handles full CI/CD pipeline with manual approval gate before promotion

## Pending Work
- [ ] Replace OTel Collector with Grafana Alloy (DaemonSet)
- [ ] Complete observability kustomization.yaml
- [ ] Update Makefile to deploy observability via kubectl (not docker-compose)
- [ ] Add Argo Rollouts bootstrap to Makefile/scripts

## Important Rules
- Never use `host.docker.internal` in K8s pod env vars — use K8s DNS or real machine IP
- No monorepo pom — each service built independently with its own `mvnw.cmd`
- Always update both `deployment.yaml` AND `rollout.yaml` when changing env vars
- Port changes require updates in: properties, config-map-k8, deployment.yaml, rollout.yaml, gateway routes
