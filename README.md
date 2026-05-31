<h1 align="center">⬡ MyOrg Microservices Platform</h1>

<p align="center">
  A production-grade Spring Boot microservices system on Kubernetes — API gateway,
  centralized config, full LGTM observability, and zero-downtime blue-green deployments.
</p>

<p align="center">
  <img alt="Java" src="https://img.shields.io/badge/Java-21-orange">
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-3.5.8-green">
  <img alt="Spring Cloud" src="https://img.shields.io/badge/Spring%20Cloud-2025.0.0-blue">
  <img alt="Kubernetes" src="https://img.shields.io/badge/Kubernetes-ready-326ce5">
  <img alt="Argo Rollouts" src="https://img.shields.io/badge/Argo%20Rollouts-blue--green-ef7b4d">
  <img alt="Grafana LGTM" src="https://img.shields.io/badge/Observability-LGTM%20%2B%20Alloy-f46800">
</p>

---

## 📖 Documentation

Full, navigable documentation lives in [`/docs`](./docs) and is published with GitHub Pages:

**➡️ https://dayasahu.github.io/MyOrg-Microservices/**

It covers architecture, setup (Windows), the API gateway & JWT flow, the config server,
observability, blue-green deployment, CI/CD, an API reference, a command cheat sheet,
and a troubleshooting guide.

---

## What's Inside

| Service | Role | Port | Deploy |
|---|---|---|---|
| `ms-api-gateway` | Single entry point, routing & JWT validation | 8888 | Deployment |
| `auth-service` | Issues JWT tokens | 9000 | Deployment |
| `employee` | Business API (calls department) | 8080 | **Blue-Green** (Argo Rollouts) |
| `department` | Business API | 8080 | **Blue-Green** (Argo Rollouts) |
| `configserver` | Serves config to all services | 8071 | Deployment |

**Observability:** Grafana Alloy (DaemonSet) collects logs, traces and metrics →
Loki / Tempo / Prometheus → Grafana (6 pre-built dashboards).

---

## Quick Start (Windows)

```bash
# 1. Install prerequisites: Docker Desktop (+K8s), kubectl, make, kubectl-argo-rollouts
# 2. Add hosts entries: api.myorg.com, grafana.myorg.com, prometheus.myorg.com, dashboard.myorg.com

make bootstrap     # one-time: NGINX Ingress, Argo Rollouts, K8s Dashboard
make up            # build + deploy observability + services + ingress
make status        # check everything is running
```

Then:
- **APIs** → http://api.myorg.com
- **Grafana** → http://grafana.myorg.com (or `:30300`)
- **Prometheus** → http://prometheus.myorg.com (or `:30900`)
- **K8s Dashboard** → https://localhost:30443

See the [Setup Guide](https://dayasahu.github.io/MyOrg-Microservices/setup.html) for full detail.

---

## Repository Layout

```
├── employee/ department/ auth-service/ ms-api-gateway/ configserver/   # services
├── config-map-k8/        # Kustomize ConfigMaps (per service, dev/prod)
├── observability/k8/     # LGTM stack + Grafana Alloy manifests
├── scripts/              # bootstrap.ps1, health-check.ps1
├── docs/                 # documentation site (GitHub Pages)
├── kustomization.yaml    # root — deploys the microservices namespace
└── Makefile              # all workflow commands
```

---

## Author

**Daya Sahu** — Platform / Backend Engineering
[LinkedIn](https://www.linkedin.com/in/daya-sahu-a709b63a/) · [GitHub](https://github.com/dayasahu)
