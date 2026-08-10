# Day 1: Deploying Modheshwari to AWS EC2

**Date:** August 4, 2026  
**Duration:** ~6 hours  
**Result:** Production deployment live at https://modheshwari.nerdev.in

---

## What Is Modheshwari?

A full-stack community management platform for hierarchical Hindu community operations. Turbo monorepo with:

- **Frontend:** Next.js 15 + React 19 + Tailwind (port 3000)
- **Backend:** Elysia + Bun (port 3001)
- **WebSocket:** Bun + ws (port 3002)
- **Database:** Neon hosted PostgreSQL
- **Cache:** Redis 7
- **Message Queue:** Kafka + Zookeeper
- **Build:** Turborepo
- **Runtime:** Bun 1.3.11

9 Docker containers orchestrated via `docker-compose.yml`.

---

## The Journey

### Act 1: The Docker Build That Wouldn't End

Started with `docker compose --env-file .env up -d --build` on a `t2.micro` (1GB RAM). The build was stuck at step 6/29 after 900+ seconds.

**Root cause:** The build context was **83MB** and took **21 minutes** just to transfer to Docker daemon. Why? `apps/web/node_modules/` was 105MB and `.dockerignore` wasn't excluding it properly.

**Fix:** Rewrote `.dockerignore` with recursive `**/` patterns:

```dockerignore
**/node_modules
**/.next
**/dist
**/build
.git
.env
```

Context dropped from 83MB → **16KB**. Transfer time: <1 second.

**Lesson learned:** Always check build context size. `docker compose build 2>&1 | grep "transferring context"` tells you.

---

### Act 2: The Missing turbo.json Mystery

Build failed with `Could not find turbo.json`. The file existed locally but wasn't in the Docker build context.

**Root cause:** EC2 had a different `.dockerignore` that excluded `turbo.json`, `tsconfig.json`, `eslint.config.js`, and even `.dockerignore` itself.

**The files the Dockerfile absolutely needs:**

- `package.json`, `bun.lock` — for `bun install`
- `apps/*/package.json`, `packages/*/package.json` — workspace setup
- `packages/db/schema.prisma` — for `prisma generate`
- `turbo.json` — for `turbo run build`
- `tsconfig.json`, `eslint.config.js` — may be needed

**Never exclude these.**

---

### Act 3: OOM Kill — The RAM Wall

Build killed with `signal: killed`. `t2.micro` has 1GB RAM. Building Bun + Next.js + native modules (bcrypt, esbuild, tree-sitter) needs 2-3GB peak.

**Fix:** Upgraded to `t3.medium` (4GB RAM):

1. EC2 Console → Stop instance
2. Actions → Change Instance Type → t3.medium
3. Start instance

**Gotcha:** Public IP changed after stop/start! Had to update GitHub Actions `HOST` secret.

**Rule of thumb:**

- `t2.micro` (1GB): Can't build this project
- `t3.small` (2GB): Barely, might OOM
- `t3.medium` (4GB): Comfortable
- `t3.large` (8GB): Production with Kafka

---

### Act 4: Disk Full — The 19GB Trap

Even with enough RAM, the build failed with `no space left on device`. Docker images + build cache ate all 19GB.

**Fix:**

1. Expanded EBS volume from 19GB → 30GB (AWS Console)
2. Resized filesystem on the instance:

```bash
sudo growpart /dev/nvme0n1 1
sudo resize2fs /dev/nvme0n1p1
```

3. Cleaned up: `docker system prune -a --volumes -f`

**Lesson:** AWS console expands the volume, but the OS filesystem needs manual resize. Always use 30GB+ for this project.

**When disk is tight, build sequentially:**

```bash
docker compose --env-file .env build be
docker compose --env-file .env build ws
docker compose --env-file .env build web
docker compose --env-file .env up -d
```

---

### Act 5: The .env Disaster

Containers started but `be` and `ws` crashed with `Missing JWT_REFRESH_SECRET`.

**Root cause:** EC2 `.env` was missing `JWT_REFRESH_SECRET` and had wrong service URLs:

- `REDIS_URL=redis://localhost:6379` → should be `redis://redis:6379`
- `KAFKA_BROKERS=localhost:9092` → should be `KAFKA_BROKER=kafka:9092`

**In Docker, services talk via service names, not localhost.**

---

### Act 6: Nginx 502 Bad Gateway

Backend worked fine locally (`curl http://localhost:3001/api/health` → OK), but nginx returned 502.

**Root cause:** Nginx cached the old backend container IP (172.18.0.4 vs 172.18.0.8).

**Fix:** `docker compose restart nginx`

**Rule:** Always restart nginx after rebuilding backend containers.

---

### Act 7: The Security Group Dance

`curl localhost` worked but browser timed out. EC2 security group didn't have HTTP (port 80).

Added inbound rule: HTTP (80) from 0.0.0.0/0.

**Gotcha:** Security group changes are instant, but make sure you're editing the one attached to your instance. After changing instance type, the security group might be different.

---

### Act 8: SSL with Certbot + Docker

Docker nginx uses port 80. Certbot needs port 80 for HTTP challenge. They conflict.

**Solution:**

```bash
# Stop Docker nginx
docker compose stop nginx

# Get cert in standalone mode
sudo certbot certonly --standalone -d modheshwari.nerdev.in

# Start Docker nginx
docker compose start nginx
```

**Updated nginx.conf:**

```nginx
server {
    listen 80;
    server_name modheshwari.nerdev.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name modheshwari.nerdev.in;
    ssl_certificate /etc/letsencrypt/live/modheshwari.nerdev.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/modheshwari.nerdev.in/privkey.pem;
    # ... proxy rules
}
```

**Updated docker-compose.yml:**

```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

**Auto-renewal:**

```bash
echo '0 12 * * * /usr/bin/certbot renew --quiet --post-hook "cd /home/ubuntu/modheshwari && docker compose restart nginx"' | sudo crontab -
```

---

### Act 9: Cloudflare 521/522 Errors

SSL cert was set up but Cloudflare couldn't reach the origin.

**Root cause:** Port 443 wasn't open in EC2 security group AND wasn't exposed in docker-compose.yml.

**Fix:** Both:

1. Security group: Add HTTPS (443) inbound rule
2. docker-compose.yml: Add `"443:443"` to nginx ports

---

### Act 10: CI/CD Pipeline

Workflow at `.github/workflows/deploy.yml`:

1. Push to main → CI runs (lint, check-types, build)
2. CI passes → SSH into EC2 → `git stash` → `git pull` → build → deploy

**Gotcha:** EC2 might have local changes that conflict with `git pull`. Added `git stash` before pull.

---

## Final Architecture

```
Browser → Cloudflare (HTTPS) → EC2:443 → Nginx (SSL termination)
                                           ├→ /api/* → be:3001
                                           ├→ /ws → ws:3002
                                           └→ /* → web:3000

be → Neon PostgreSQL (ap-southeast-1 Singapore)
be → Redis (redis:6379)
be → Kafka (kafka:9092)
ws → Redis + Kafka
```

**DNS:** modheshwari.nerdev.in → A record → 3.111.41.101 (Cloudflare proxied)

---

## Commands Reference

```bash
# Deploy
docker compose --env-file .env up -d --build

# Build sequentially (disk-tight)
docker compose --env-file .env build be
docker compose --env-file .env build ws
docker compose --env-file .env build web
docker compose --env-file .env up -d

# Status
docker compose ps
docker compose logs --tail=20

# Restart specific service
docker compose restart nginx

# Migrations (Neon)
docker compose exec be bunx prisma migrate deploy --schema packages/db/schema.prisma

# Cleanup
docker system prune -a --volumes -f
df -h /

# SSL
sudo certbot renew

# Check build context size
docker compose --env-file .env build 2>&1 | grep "transferring context"
```

---

## Files Modified

| File                                  | What Changed                                          |
| ------------------------------------- | ----------------------------------------------------- |
| `.dockerignore`                       | Recursive exclusions, kept build-critical files       |
| `Dockerfile`                          | Added `# syntax=docker/dockerfile:1`, bun cache mount |
| `docker-compose.yml`                  | Added port 443, cert volume mount                     |
| `nginx.conf`                          | SSL server block, HTTP→HTTPS redirect                 |
| `.github/workflows/deploy.yml`        | Added `git stash` before pull                         |
| `apps/web/app/medical/page.tsx`       | Removed unused `logout`                               |
| `apps/web/app/notifications/page.tsx` | Removed unused `apiFetch`, `Me`, `userLoading`        |
| `apps/web/app/resources/page.tsx`     | Removed unused `useCallback`, `Me`                    |
| `deploy.md`                           | Full deployment guide with SSL, Neon, lessons learned |
| `deploy-learn.md`                     | Detailed session notes                                |

---

## Key Takeaways

1. **`.dockerignore` is critical** — bad exclusions = slow builds or build failures
2. **Instance type matters** — `t2.micro` can't build this project, need `t3.medium`+
3. **Disk fills fast** — Docker + node_modules = 15GB+, use 30GB+ volume
4. **EC2 public IP changes** on stop/start — use Elastic IP for production
5. **Docker services use service names** — `redis://redis:6379`, not `localhost`
6. **Always restart nginx** after rebuilding backend
7. **SSL + Docker = stop nginx first** — certbot needs port 80
8. **Security groups are instant** — but verify they're on the right instance
9. **EBS resize needs filesystem resize** — `growpart` + `resize2fs`
10. **CI/CD `git pull` can fail** — stash local changes first

---

## Cost

| Item            | Cost           |
| --------------- | -------------- |
| t3.medium (4GB) | ~$30/month     |
| 30GB gp3 EBS    | ~$3/month      |
| Neon DB         | Free tier      |
| Cloudflare      | Free           |
| Domain          | ~$12/year      |
| **Total**       | **~$35/month** |

---

_This document is a memoir of the first deployment session. Things will go wrong. That's normal. The key is to read the errors, understand what they mean, and fix one thing at a time._
