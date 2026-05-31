# AGENTS: How to be productive in this repo

This document is a concise, actionable guide for AI coding agents that will work on this microservices project.

Checklist (what I'll do first)
- Understand service boundaries: `employee`, `department`, `auth-service`, `ms-api-gateway`, `configserver`.
- Read `spring-config-k8s/` for environment overlays and config-by-kustomize.
- Use service-level `mvnw`/`mvnw.cmd` to build and `Dockerfile` to containerize.
- Inspect `k8/` manifests in each service and tekton pipelines under `employee/k8/tekton`.

High-level architecture (quick summary)
- Microservices (Spring Boot) per folder: `employee`, `department`, `auth-service`, plus `ms-api-gateway` (Spring Cloud Gateway) and a `configserver`.
- Centralized configuration via Spring Cloud Config: `configserver` + `spring-config-k8s` holds kustomize overlays and per-service property files (example: `spring-config-k8s/apigateway/base/apigateway.properties`).
- API gateway routes services (see `apigateway.properties` — routes configured with `spring.cloud.gateway.server.webflux.routes[...]`).
- Observability: actuator endpoints enabled across services; micrometer + OpenTelemetry dependencies present (see `employee/pom.xml` for `micrometer-tracing-bridge-otel` and `opentelemetry-exporter-otlp`).

Key patterns and conventions (project-specific)
- Build: there is no single root aggregator pom — build each service in its directory with the included Maven wrapper. On Windows use `mvnw.cmd`.
  - Example: from `employee/`: `.\mvnw.cmd clean package` (use `-DskipTests` for faster iteration).
- Container images and k8 manifests are decoupled: manifests contain image names/tags (e.g. `dayasahu6077/employee:v26dec2am` in `docker-compose.yml`, `dayasahu6077/gateway-server:26April` in `ms-api-gateway/k8/deployment.yaml`). Agents modifying images must also update corresponding `k8/` manifests or CI pipeline manifests.
- Health checks: services expose Actuator endpoints and k8 readiness/liveness probe paths reference them (examples: `ms-api-gateway` probes use `/actuator/health/readiness` and `/actuator/health/liveness`, `auth-service` uses `/actuator/health`). Use these endpoints when adding or changing readiness checks.
- Config import pattern: services use `SPRING_CONFIG_IMPORT` or `spring.cloud.config` properties to pull config from the config server. Local dev docker-compose sets `SPRING_CONFIG_IMPORT=configserver:http://configserver:8071`.
- Kustomize: `spring-config-k8s/` holds kustomization.yaml and per-service overlays (use `kustomize build` or `kubectl apply -k`).

Developer workflows (concrete commands)
- Build a single service (Windows PowerShell):
  - cd into the service and run: `.\mvnw.cmd clean package`
- Build Docker image for a service (from service root):
  - `docker build -t <repo>/<service>:<tag> .`
  - Push: `docker push <repo>/<service>:<tag>` (k8 manifests reference static tags).
- Local dev with compose (example):
  - `docker-compose -f employee/docker-compose.yml up --build` (note: `docker-compose.yml` mounts a local config path in the example; adjust volume paths).
- Deploy to Kubernetes (kustomize):
  - `kubectl apply -k spring-config-k8s/` or `kustomize build spring-config-k8s/ | kubectl apply -f -`

CI/CD and infra notes
- Tekton pipelines for the `employee` service exist under `employee/k8/tekton/` (tasks: docker build/push, maven build, kubectl deploy). If automating, prefer reusing these manifests.
- README-CICD.md documents common Tekton pod security issues; Tekton tasks may fail on clusters with strict PodSecurity admission (see `employee/README-CICD.md`).

Where to look for examples (key files)
- Service pom: `employee/pom.xml` (Java 21, Spring Boot 3.5.8, Spring Cloud 2025.0.0)
- Gateway routes and properties: `spring-config-k8s/apigateway/base/apigateway.properties`
- K8 manifests per service: each service has a `k8/deployment.yaml`, `k8/service.yaml` and sometimes `k8/secret.yaml`.
- Docker compose example: `employee/docker-compose.yml` (illustrates local configserver mount and image names).
- Tekton CI manifests: `employee/k8/tekton/`.

Agent behavior rules (do these when making changes)
1. When changing a service port, update all references: service `application.properties` / `spring-config-k8s` properties, `k8/deployment.yaml` containerPort, and `apigateway` routes if needed.
2. If you change an image build process or tag, update docker-compose and `k8` manifests (images are not templated here).
3. Use Actuator endpoints introduced by maintainers for health checks — prefer `/actuator/health`, `/actuator/health/readiness`, and `/actuator/health/liveness` as seen in manifests.
4. Prefer reading `pom.xml` in each module to learn used frameworks and metrics/tracing libraries before modifying instrumentation.

If you need more context, open these files first:
- `employee/pom.xml`, `ms-api-gateway/k8/deployment.yaml`, `auth-service/k8/deployment.yaml`, `employee/docker-compose.yml`, `spring-config-k8s/**`.

Limitations of repo discovery
- No monorepo root pom detected; CI glue may live outside repo or in Tekton manifests. Image tags are hard-coded in manifests — search before changing.

End of AGENTS guidance

