# Observability Stack — LGTM + OpenTelemetry

A complete, locally-runnable observability stack for the microservices in
this repo. Built on the standard **LGTM** + **OpenTelemetry Collector**
pattern that's used in production at most companies running Spring Boot
on Kubernetes.

## What's in here

| Component | Role | Port |
|---|---|---|
| **OpenTelemetry Collector** | Single ingress for traces, metrics, logs | `:4317` (gRPC) `:4318` (HTTP) |
| **Loki** | Log storage + LogQL query API | `:3100` |
| **Tempo** | Distributed trace storage + search | `:3200` |
| **Prometheus** | Metrics TSDB + PromQL | `:9090` |
| **Grafana** | UI for all of the above | `:3000` |

## Architecture

```
                                  ┌─────────────────────┐
                                  │  Spring Boot apps   │
   employee · department · gateway · configserver · auth │
                                  └──────────┬──────────┘
                                             │ OTLP (traces + metrics + logs)
                                             ▼
                              ┌──────────────────────────────┐
                              │     OpenTelemetry            │
                              │     Collector :4317/:4318    │
                              │  receivers / processors /    │
                              │  exporters                   │
                              └────┬───────┬────────┬────────┘
                                   │       │        │
                              traces│ metrics       │logs
                                   ▼       ▼        ▼
                              ┌──────┐ ┌──────────┐ ┌──────┐
                              │Tempo │ │Prometheus│ │ Loki │
                              │:3200 │ │  :9090   │ │:3100 │
                              └───┬──┘ └─────┬────┘ └──┬───┘
                                  │          │         │
                                  └──────────┴─────────┘
                                             │
                                             ▼
                                       ┌──────────┐
                                       │ Grafana  │
                                       │  :3000   │
                                       └──────────┘
```

Why a collector in the middle? It decouples *what your services emit*
from *where it gets stored*. Swap Loki for Elastic, add Datadog as a
mirror exporter, change sampling — none of it touches the services.

## Quick start

```bash
# 1. Create the shared network (one-time)
docker network create observability

# 2. Bring up the LGTM + OTel stack
docker compose -f observability/docker-compose.yml up -d

# 3. Bring up your services on the same network
docker compose -f employee/docker-compose.yml up -d

# 4. Open Grafana
#    http://localhost:3000  (anonymous Admin)
```

The Grafana datasources (Prometheus / Loki / Tempo) and the
**Spring Microservices Overview** dashboard are auto-provisioned.

## Verify the stack is healthy

```bash
# Collector health
curl http://localhost:13133

# Loki ready
curl http://localhost:3100/ready

# Tempo ready
curl http://localhost:3200/ready

# Prometheus targets (look for "spring-services" job)
open http://localhost:9090/targets

# Generate some traffic
for i in {1..20}; do curl -s http://localhost:8888/employee/employees > /dev/null; done
```

Then in Grafana:
- **Explore → Loki**: `{service_name="employee"}` should return lines
- **Explore → Tempo**: search by service name `employee`
- **Explore → Prometheus**: `rate(http_server_requests_seconds_count[1m])`
- Click any trace → "Logs for this span" should jump to Loki with the
  matching `traceId`. That's the LGTM superpower.

## Key files

```
observability/
├── docker-compose.yml                 # the stack
├── otel-collector/
│   └── config.yaml                    # receivers, processors, exporters
├── loki/
│   └── loki-config.yaml               # single-binary config + filesystem storage
├── tempo/
│   └── tempo-config.yaml              # OTLP receiver + metrics_generator
├── prometheus/
│   └── prometheus.yml                 # scrape collector + service /actuator/prometheus
└── grafana/
    ├── provisioning/
    │   ├── datasources/datasources.yaml    # auto-wires Prom/Loki/Tempo
    │   └── dashboards/dashboards.yaml
    └── dashboards/
        └── spring-boot-overview.json       # request rate, latency, errors, JVM, logs
```

## How services emit telemetry

Each service's `pom.xml` now includes:

```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
  <groupId>io.opentelemetry</groupId>
  <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
<dependency>
  <groupId>io.opentelemetry.instrumentation</groupId>
  <artifactId>opentelemetry-logback-appender-1.0</artifactId>
  <version>2.4.0</version>
</dependency>
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

Each service's `application.properties` points at the collector:

```properties
management.tracing.sampling.probability=1.0
management.otlp.tracing.endpoint=${OTEL_TRACES_ENDPOINT:http://otel-collector:4318/v1/traces}
management.otlp.metrics.export.url=${OTEL_METRICS_ENDPOINT:http://otel-collector:4318/v1/metrics}
management.otlp.logging.endpoint=${OTEL_LOGS_ENDPOINT:http://otel-collector:4318/v1/logs}
management.endpoints.web.exposure.include=health,info,metrics,prometheus,...
```

Each service's `logback-spring.xml` adds the OTLP appender alongside the
existing console one:

```xml
<appender name="OTEL"
          class="io.opentelemetry.instrumentation.logback.appender.v1_0.OpenTelemetryAppender">
  <captureMdcAttributes>*</captureMdcAttributes>
</appender>
<root level="info">
  <appender-ref ref="STDOUT"/>
  <appender-ref ref="OTEL"/>
</root>
```

Spring Boot 3.5 auto-configures the OTel SDK from those properties — no
Java code changes needed.

## Sample queries

**LogQL** (Loki):

```logql
# All errors across all services in the last 15 min
{service_name=~"employee|department|ms-api-gateway|configserver"} |~ "(?i)error|exception"

# Logs for a specific trace
{service_name="employee"} |= "4f9c1aabbb1234567890abcdef012345"

# Rate of WARN+ logs per service
sum by (service_name) (count_over_time({} |~ "WARN|ERROR" [5m]))
```

**PromQL** (Prometheus):

```promql
# p99 latency
histogram_quantile(0.99, sum by (service, le) (rate(http_server_requests_seconds_bucket[5m])))

# Error rate
sum by (service) (rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
  / sum by (service) (rate(http_server_requests_seconds_count[5m]))

# JVM heap pressure
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}
```

**TraceQL** (Tempo):

```traceql
# Slow requests
{ duration > 500ms }

# Errors
{ status = error }

# Specific service
{ resource.service.name = "employee" }
```

## Troubleshooting

**"No data" in Grafana:**

1. `docker logs otel-collector` — should show `Everything is ready`
2. `curl http://localhost:9090/targets` — Prometheus targets should be `up`
3. Generate traffic with `curl http://localhost:8888/employee/employees`

**Collector won't start:**
Validate the YAML with the official tool:
```bash
docker run --rm -v ./otel-collector/config.yaml:/cfg.yaml \
  otel/opentelemetry-collector-contrib:0.96.0 \
  --config=/cfg.yaml --dry-run
```

**Loki rejects logs ("entry too far behind"):**
That's a clock-skew issue. Make sure your host clock is synced.

**`management.otlp.logging.endpoint` doesn't exist:**
That property name was added around Spring Boot 3.4. On 3.5.x it works.
On older versions, use the OTel Logback appender's properties instead.

## Production hardening (out of scope for this dev stack)

- Replace filesystem storage on Loki/Tempo with S3/GCS
- Run multi-tenant Loki/Tempo with auth gateways
- Use the [Grafana Agent](https://grafana.com/docs/agent/) instead of
  the contrib collector if you only need LGTM
- Lower `management.tracing.sampling.probability` to ~0.05–0.10 in prod
- Add an Alertmanager + alerting rules in `prometheus/`

## Wiring this to the log-agent

`ms-log-agent/` already points at `LOKI_URL=http://localhost:3100` by
default — no changes needed. Add the agent's container to the
`observability` network if you want to run it alongside everything else.
