# Deployment Guide

This guide covers production deployment options for Notification Bot Notifier, focusing on persistent storage, reverse proxies, and continuous availability.

---

## 1. Docker Compose (Recommended)

Docker Compose ensures seamless container lifecycle management and persistent storage mapping.

### docker-compose.yml

```yaml
services:
  notifier:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### Initial Run & Authentication

Because WhatsApp authentication requires scanning a terminal QR code, run the interactive container first:

```bash
docker compose run --rm notifier npm run list-groups
```

Once paired and groups are listed, start the daemon:

```bash
docker compose up -d
```

Check logs:
```bash
docker compose logs -f notifier
```

---

## 2. Storage Persistence Requirement

> [!IMPORTANT]
> The `./data` volume mount (`./data:/app/data`) is mandatory.
> If the container is recreated without mounting `./data`, the WhatsApp session keys will be lost, requiring a new QR scan.

---

## 3. Reverse Proxy & HTTPS

Webhooks from GitHub and Jira require publicly reachable HTTPS endpoints.

### Nginx Example

```nginx
server {
    server_name notifier.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    # ssl_certificate and ssl_certificate_key managed by certbot
}
```

### Cloudflare Tunnel

Alternatively, expose port `3000` securely without open inbound firewall ports:

```bash
cloudflared tunnel --url http://localhost:3000
```

---

## 4. Updates & Maintenance

To deploy an update:

```bash
git pull origin main
docker compose build
docker compose up -d
```

The persistent session stored in `./data` will ensure WhatsApp re-connects automatically without scanning a QR code.
