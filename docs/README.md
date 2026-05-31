# MyOrg Platform — Documentation Site

A self-contained, static HTML documentation site for the MyOrg microservices platform.
No build step, no dependencies, no internet required — pure HTML/CSS/JS.

## Pages
| File | Topic |
|---|---|
| `index.html` | Overview + end-to-end architecture diagram |
| `setup.html` | Windows setup guide, prerequisites, dashboard token |
| `cross-cutting.html` | Cross-cutting concerns & solutions |
| `patterns.html` | Design patterns, rationale, alternatives |
| `gateway.html` | API Gateway pattern + JWT flow |
| `config-server.html` | Config Server & why vs alternatives |
| `observability.html` | LGTM + Alloy, dashboards, tracing, comparisons |
| `deployment.html` | Deployment patterns + blue-green |
| `cicd.html` | GitHub Actions pipeline, Argo Rollouts vs Argo CD |
| `tooling.html` | Makefile, bootstrap, root Kustomization |

## How to view locally
Just open `index.html` in a browser — everything is relative-pathed.

Or serve it (any static server works):
```bash
# Python
cd docs && python -m http.server 8000
# then open http://localhost:8000
```

## How to host
Drop the `docs/` folder onto any static host:
- **GitHub Pages** — set Pages source to `/docs` on the default branch.
- **Netlify / Vercel / Cloudflare Pages** — point at the `docs/` directory, no build command.
- **S3 + CloudFront** — upload the folder, set `index.html` as the index document.
- **NGINX / Apache** — copy `docs/` into the web root.
