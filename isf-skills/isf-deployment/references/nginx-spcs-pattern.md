# Multi-Process SPCS Deployment Pattern

Pattern for running multiple processes (nginx + uvicorn) in a single SPCS container using supervisord. Use when the app needs nginx as a reverse proxy (WebSocket upgrades, static file caching, path-based routing).

## When to Use

| Scenario | Pattern |
|----------|---------|
| React + FastAPI, no WebSocket | Single-process uvicorn (default ISF pattern) |
| React + FastAPI + WebSocket | **Multi-process: nginx + uvicorn + supervisord** |
| Multiple backend services | **Multi-process: nginx + service1 + service2** |

## Dockerfile (Multi-Stage)

```dockerfile
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY src/ui/package*.json ./
RUN npm ci
COPY src/ui/ ./
RUN npm run build

FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx supervisor && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ ./api/

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY deploy/spcs/nginx.conf /etc/nginx/nginx.conf
COPY deploy/spcs/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8080
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

**CRITICAL**: SPCS exposes one port per endpoint. nginx listens on 8080 and routes to uvicorn on 8000 internally.

## nginx.conf

```nginx
worker_processes auto;
error_log /dev/stderr warn;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    access_log /dev/stdout;
    sendfile on;
    keepalive_timeout 65;

    upstream backend {
        server 127.0.0.1:8000;
    }

    server {
        listen 8080;

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket upgrade
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }

        # Health check (bypass nginx for probe)
        location /health {
            proxy_pass http://backend/health;
        }

        # Static files (React build)
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
            root /usr/share/nginx/html;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## supervisord.conf

```ini
[supervisord]
nodaemon=true
logfile=/dev/null
logfile_maxbytes=0

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:uvicorn]
command=uvicorn api.app.main:app --host 0.0.0.0 --port 8000
directory=/app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
```

## SPCS Service Spec

```yaml
spec:
  containers:
    - name: app
      image: /{DATABASE}/{SCHEMA}/{REPO}/{IMAGE}:latest
      resources:
        requests:
          cpu: "0.5"
          memory: "1Gi"
        limits:
          cpu: "2"
          memory: "4Gi"
      readinessProbe:
        port: 8080
        path: /health
  endpoints:
    - name: app
      port: 8080
      public: true
```

## Critical Patterns

| Pattern | Requirement | Reason |
|---------|-------------|--------|
| `proxy_http_version 1.1` | Required for WebSocket | HTTP/1.0 does not support Upgrade |
| `proxy_read_timeout 86400` | Set high for WS | Default 60s will drop idle connections |
| `try_files $uri /index.html` | Required for React Router | SPA client-side routing |
| `nodaemon=true` | Required in supervisord | Container needs foreground process |
| Logs to `/dev/stdout` | Required | SPCS `service logs` reads stdout/stderr |
| Port 8080 external, 8000 internal | Required | SPCS readinessProbe hits nginx, not uvicorn directly |

## Project Structure

```
deploy/spcs/
├── Dockerfile
├── nginx.conf
├── supervisord.conf
└── service-spec.yaml
```

## Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| WebSocket 400 error | Missing Upgrade headers | Add `proxy_http_version 1.1` and `Connection "upgrade"` |
| Static files 404 | Wrong root path | Verify `COPY --from=frontend-build` destination matches `root` |
| Container exits immediately | supervisord not foreground | Ensure `nodaemon=true` |
| Health check fails | Probe hitting nginx, not backend | Ensure `/health` proxies to backend |
