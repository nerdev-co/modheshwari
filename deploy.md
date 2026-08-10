# Deployment Guide - Modheshwari App

Complete deployment instructions for AWS EC2 with GitHub Actions CI/CD.

---

## Architecture

**Detected Stack:**

- **Frontend:** Next.js 15 (React 19) - Port 3000
- **Backend:** Elysia + Bun - Port 3001
- **WebSocket:** Bun + ws - Port 3002
- **Database:** PostgreSQL 15 - Port 5432
- **Cache:** Redis 7 - Port 6379
- **Message Queue:** Kafka - Port 9092
- **Build Tool:** Turbo monorepo
- **Runtime:** Bun 1.x

---

## Prerequisites

| Item        | Requirement            |
| ----------- | ---------------------- |
| VM          | AWS EC2 Ubuntu 22.04   |
| RAM         | 4GB+ (8GB with Kafka)  |
| Storage     | 30GB+                  |
| Domain      | Optional (recommended) |
| GitHub Repo | Your forked repo       |

---

## AWS EC2 Setup

### 1. Launch Instance

1. **AWS Console → EC2 → Launch Instance**
2. **Name:** modheshwari-prod
3. **AMI:** Ubuntu 22.04 LTS
4. **Instance Type:**
   - Without Kafka: `t3.small` (2GB RAM, ~$15/month)
   - With Kafka: `t3.medium` (4GB RAM, ~$30/month)
5. **Key Pair:** Create new or use existing (ec2-modheshwari.pem)
6. **Storage:** 30GB gp3

### 2. Security Group

Create/modify security group with these **Inbound Rules:**

| Type       | Port | Source     | Description    |
| ---------- | ---- | ---------- | -------------- |
| SSH        | 22   | Your IP/32 | SSH access     |
| HTTP       | 80   | 0.0.0.0/0  | Nginx          |
| HTTPS      | 443  | 0.0.0.0/0  | SSL (optional) |
| Custom TCP | 3000 | 0.0.0.0/0  | Next.js Web    |
| Custom TCP | 3001 | 0.0.0.0/0  | Backend API    |
| Custom TCP | 3002 | 0.0.0.0/0  | WebSocket      |

### 3. Get Public IP

Note your instance public IP (e.g., `13.203.102.177`)

---

## Local Setup (One Time)

### 1. Generate JWT Secret

```bash
# On your local machine
openssl rand -base64 32
```

Copy the output - you'll need it for .env

### 2. Create GitHub Secrets

Go to **GitHub → Repo → Settings → Secrets → Actions**

Add these secrets:

| Secret    | Value               | Example              |
| --------- | ------------------- | -------------------- |
| `HOST`    | VM Public IP        | `13.203.102.177`     |
| `USER`    | SSH username        | `ubuntu`             |
| `SSH_KEY` | Private key content | (paste .pem content) |

### 3. Add SSH Key to VM

```bash
# Copy public key to VM
ssh ubuntu@YOUR_VM_IP "echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
```

Or in VM:

```bash
sudo nano ~/.ssh/authorized_keys
# Paste your public key
```

---

## VM Setup (First Time Only)

### 1. Connect to VM

```bash
chmod 400 /path/to/ec2-modheshwari.pem
ssh -i /path/to/ec2-modheshwari.pem ubuntu@YOUR_VM_IP
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt update
sudo apt install docker-compose git nginx -y
```

### 3. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/modheshwari.git
cd modheshwari
```

### 4. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Edit required variables:**

```env
# ============================================
# CORE (Required)
# ============================================

# Database - uses docker service name "db"
DATABASE_URL=postgresql://modheshwari:changeme@db:5432/modheshwari

# JWT Secret - generate with: openssl rand -base64 32
JWT_SECRET=YOUR_GENERATED_SECRET_HERE

# Redis - uses docker service name "redis"
REDIS_URL=redis://redis:6379

# Kafka - uses docker service name "kafka" (skip if not using Kafka)
KAFKA_BROKERS=kafka:9092

# App URLs - replace with your VM IP or domain
APP_URL=http://YOUR_VM_IP:3000
API_URL=http://YOUR_VM_IP:3001
NEXT_PUBLIC_API_BASE_URL=http://YOUR_VM_IP:3001
CORS_ORIGIN=http://YOUR_VM_IP:3000

# WebSocket
WS_PORT=3002
NODE_ENV=production

# ============================================
# OPTIONAL - Notifications
# ============================================

# Email (choose one: smtp, sendgrid, ses)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SEND_FROM_EMAIL=noreply@yourdomain.com

# Or SendGrid:
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=your-sendgrid-key

# Push Notifications (Firebase)
# FIREBASE_PROJECT_ID=your-project
# FIREBASE_PRIVATE_KEY=your-private-key
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# ============================================
# OPTIONAL - Payments
# ============================================

# Razorpay (India)
# RAZORPAY_KEY_ID=your-key-id
# RAZORPAY_KEY_SECRET=your-key-secret
```

Save: `Ctrl+X`, `Y`, `Enter`

### 5. Kafka Configuration (Optional)

If using **t3.small (1GB RAM)**, skip Kafka:

```bash
nano docker-compose.override.yml
```

```yaml
# Skip Kafka on small instances
services:
  zookeeper:
    deploy:
      resources:
        limits:
          memory: 512M
  kafka:
    deploy:
      resources:
        limits:
          memory: 1G
  kafka-ui:
    # Don't run kafka-ui without kafka
```

### 6. Initial Database Setup

**If using Neon (hosted PostgreSQL):**

```bash
# Run migrations against Neon (DATABASE_URL in .env points to Neon)
docker compose exec be bunx prisma migrate deploy --schema packages/db/schema.prisma
```

**If using local Docker PostgreSQL:**

```bash
# Start database and redis first
docker compose up -d db redis

# Wait for database to be ready
sleep 10

# Run migrations
docker compose exec be bunx prisma migrate deploy --schema packages/db/schema.prisma

# Optional: Seed database
docker compose exec be bun run db:seed
```

### 7. Deploy All Services

```bash
# Build and start all services
docker-compose --env-file .env up -d --build
```

⏳ First build takes 10-15 minutes

---

## GitHub Actions CI/CD (Auto-Deploy)

### How It Works

1. Push code to `main` branch
2. GitHub Actions runs: `bun install` → `bun run check-types` → `bun run build`
3. On success, auto-deploys to VM via SSH

### Workflow File

The workflow is at `.github/workflows/deploy.yml`:

```yaml
name: CI & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run check-types
      - run: bun run build

  deploy:
    needs: ci
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/modheshwari
            git pull
            docker-compose --env-file .env up -d --build
```

### Trigger Deployment

```bash
# Make a small change and push
git add .
git commit -m "test deployment"
git push origin main
```

---

## Service URLs

| Service     | Port | URL                               |
| ----------- | ---- | --------------------------------- |
| Next.js Web | 3000 | http://YOUR_VM_IP:3000            |
| Backend API | 3001 | http://YOUR_VM_IP:3001/api/health |
| WebSocket   | 3002 | ws://YOUR_VM_IP:3002              |
| Kafka UI    | 8080 | http://YOUR_VM_IP:8080            |

## Final Architecture

```
Browser → Cloudflare (HTTPS) → EC2:443 → Nginx (SSL termination)
                                           ├→ /api/* → be:3001
                                           ├→ /ws → ws:3002
                                           └→ /* → web:3000

be → Neon PostgreSQL (ap-southeast-1)
be → Redis (redis:6379)
be → Kafka (kafka:9092)
ws → Redis + Kafka
```

---

## Nginx Reverse Proxy (Production)

The nginx config is mounted from `nginx.conf` into the Docker container. Edit the file on the host, then restart:

```bash
nano nginx.conf
docker compose restart nginx
```

### Current nginx.conf (with SSL)

```nginx
upstream web {
    server web:3000;
}

upstream be {
    server be:3001;
}

upstream ws {
    server ws:3002;
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

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

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://be;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;

        if ($http_upgrade ~ "websocket") {
            proxy_pass http://ws;
        }
        proxy_pass http://web;
    }
}
```

### URLs After Nginx

| Service   | URL                            |
| --------- | ------------------------------ |
| Web       | https://modheshwari.nerdev.in  |
| API       | https://modheshwari.nerdev.in/api |
| WebSocket | wss://modheshwari.nerdev.in/ws |

---

## SSL/HTTPS Setup (Let's Encrypt + Certbot)

### Prerequisites
- Domain pointing to your EC2 IP (A record in DNS)
- Port 80 and 443 open in EC2 security group

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Get Certificate

Since Docker nginx uses port 80, stop it first and use standalone mode:

```bash
cd ~/modheshwari
docker compose stop nginx

sudo certbot certonly --standalone -d modheshwari.nerdev.in

docker compose start nginx
```

### 3. Update docker-compose.yml

Add port 443 and cert volume to nginx service:

```yaml
nginx:
    image: nginx:alpine
    container_name: modheshwari-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - web
      - be
      - ws
```

### 4. Update nginx.conf

Add HTTP→HTTPS redirect and SSL server block (see nginx config above).

### 5. Restart nginx

```bash
docker compose restart nginx
```

### 6. Auto-Renewal

Certbot sets up automatic renewal, but Docker nginx needs restart after renewal:

```bash
echo '0 12 * * * /usr/bin/certbot renew --quiet --post-hook "cd /home/ubuntu/modheshwari && docker compose restart nginx"' | sudo crontab -
```

### 7. Cloudflare DNS

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | modheshwari | YOUR_EC2_IP | Proxied |

### 8. Security Group

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP/32 |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

---

## Maintenance Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f be      # Backend
docker-compose logs -f web    # Frontend
docker-compose logs -f ws     # WebSocket
docker-compose logs -f db    # Database
docker-compose logs -f redis # Redis
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart be
docker-compose restart web
```

### Update Code

```bash
# Pull latest and rebuild
git pull
docker-compose --env-file .env up -d --build
```

### Database Migrations

```bash
docker-compose exec be bunx prisma migrate deploy
docker-compose exec be bunx prisma generate
```

### Check Status

```bash
docker-compose ps
docker stats
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Common issues:
# - DATABASE_URL wrong → check .env
# - Port already in use → sudo lsof -i :3000
# - Out of memory → use smaller instance or skip Kafka
```

### Database Connection Failed

```bash
# Check if db is running
docker-compose ps db

# Check db logs
docker-compose logs db

# Wait for health check
docker-compose up -d db
sleep 15
```

### Build Fails

```bash
# Rebuild without cache
docker-compose build --no-cache

# Or clean and rebuild
docker-compose down
docker system prune -a
docker-compose up -d --build
```

### Out of Memory

If using t3.small, skip Kafka:

```bash
# Edit docker-compose.override.yml
nano docker-compose.override.yml
```

```yaml
services:
  zookeeper:
    profiles: ["full"]
  kafka:
    profiles: ["full"]
  kafka-ui:
    profiles: ["full"]
```

Then run without Kafka profiles:

```bash
docker-compose --env-file .env up -d --profile default
```

---

## Complete Quick Start Commands

```bash
# 1. SSH to VM
ssh -i ec2-modheshwari.pem ubuntu@YOUR_VM_IP

# 2. Install Docker (first time)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt update && sudo apt install docker-compose git nginx -y

# 3. Clone & configure
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/modheshwari.git
cd modheshwari
cp .env.example .env
nano .env  # Edit with your values

# 4. Deploy
docker-compose --env-file .env up -d --build

# 5. Test
curl http://localhost:3001/api/health
```

---

## Day 1 Deployment Journey

Real deployment session notes from deploying Modheshwari to AWS EC2 on August 4, 2026.

### Act 1: The Docker Build That Wouldn't End

Started with `docker compose --env-file .env up -d --build` on a `t2.micro` (1GB RAM). The build was stuck at step 6/29 after 900+ seconds.

**Root cause:** The build context was **83MB** and took **21 minutes** just to transfer to Docker daemon. Why? `apps/web/node_modules/` was 105MB and `.dockerignore` wasn't excluding it properly.

**Fix:** Rewrote `.dockerignore` with recursive `**/` patterns. Context dropped from 83MB → **16KB**. Transfer time: <1 second.

**Lesson:** Always check build context size. `docker compose build 2>&1 | grep "transferring context"` tells you.

### Act 2: The Missing turbo.json Mystery

Build failed with `Could not find turbo.json`. The file existed locally but wasn't in the Docker build context.

**Root cause:** `.dockerignore` excluded `turbo.json`, `tsconfig.json`, `eslint.config.js`, and `.dockerignore` itself.

**The files the Dockerfile absolutely needs:**

- `package.json`, `bun.lock` — for `bun install`
- `apps/*/package.json`, `packages/*/package.json` — workspace setup
- `packages/db/schema.prisma` — for `prisma generate`
- `turbo.json` — for `turbo run build`
- `tsconfig.json`, `eslint.config.js` — may be needed

**Never exclude these.**

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

### Act 5: The .env Disaster

Containers started but `be` and `ws` crashed with `Missing JWT_REFRESH_SECRET`.

**Root cause:** EC2 `.env` was missing `JWT_REFRESH_SECRET` and had wrong service URLs:

- `REDIS_URL=redis://localhost:6379` → should be `redis://redis:6379`
- `KAFKA_BROKERS=localhost:9092` → should be `KAFKA_BROKER=kafka:9092`

**In Docker, services talk via service names, not localhost.**

### Act 6: Nginx 502 Bad Gateway

Backend worked fine locally (`curl http://localhost:3001/api/health` → OK), but nginx returned 502.

**Root cause:** Nginx cached the old backend container IP (172.18.0.4 vs 172.18.0.8).

**Fix:** `docker compose restart nginx`

**Rule:** Always restart nginx after rebuilding backend containers.

### Act 7: The Security Group Dance

`curl localhost` worked but browser timed out. EC2 security group didn't have HTTP (port 80).

Added inbound rule: HTTP (80) from 0.0.0.0/0.

**Gotcha:** Security group changes are instant, but make sure you're editing the one attached to your instance. After changing instance type, the security group might be different.

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

### Act 9: Cloudflare 521/522 Errors

SSL cert was set up but Cloudflare couldn't reach the origin.

**Root cause:** Port 443 wasn't open in EC2 security group AND wasn't exposed in docker-compose.yml.

**Fix:** Both:
1. Security group: Add HTTPS (443) inbound rule
2. docker-compose.yml: Add `"443:443"` to nginx ports

### Act 10: CI/CD Pipeline

Workflow at `.github/workflows/deploy.yml`:

1. Push to main → CI runs (lint, check-types, build)
2. CI passes → SSH into EC2 → `git stash` → `git pull` → build → deploy

**Gotcha:** EC2 might have local changes that conflict with `git pull`. Added `git stash` before pull.

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

## Files Modified During Deployment

| File | Change |
|------|--------|
| `.dockerignore` | Added recursive exclusions, removed turbo.json etc. |
| `Dockerfile` | Added `# syntax=docker/dockerfile:1`, bun cache mount, packages/config workspace support |
| `docker-compose.yml` | Added port 443, cert volume mount for nginx |
| `nginx.conf` | Added SSL server block, HTTP→HTTPS redirect |
| `.github/workflows/deploy.yml` | Added `git stash` before pull |
| `apps/web/app/medical/page.tsx` | Removed unused `logout` |
| `apps/web/app/notifications/page.tsx` | Removed unused `apiFetch`, `Me`, `userLoading` |
| `apps/web/app/resources/page.tsx` | Removed unused `useCallback`, `Me` |
| `packages/config/` | New workspace package for centralized env loading |
| `apps/be/lib/outbox.ts` | Transactional outbox helper |
| `apps/be/kafka/workers/outboxRelay.ts` | Outbox relay with DLQ promotion |
| `apps/be/kafka/workers/esReconciliation.ts` | Periodic ES reconciliation worker |
| `apps/ws/handlers.ts` | Message durability + sync pagination |
| `deploy.md` | Full deployment guide with SSL, Neon, lessons learned, Day 1 journey |

---

_This document is the single source of truth for deployment. For real-world deployment issues and fixes, see the "Day 1 Deployment Journey" section above._

---

## Cost Estimate

| Resource               | Monthly Cost |
| ---------------------- | ------------ |
| t3.small (no Kafka)    | ~$15         |
| t3.medium (with Kafka) | ~$30         |
| t3.large (production)  | ~$60         |
| Domain (optional)      | ~$12/year    |

---

## Files Reference

| File                           | Purpose                           |
| ------------------------------ | --------------------------------- |
| `docker-compose.yml`           | All services definition           |
| `Dockerfile`                   | Multi-stage build for be, ws, web |
| `.env.example`                 | Environment template              |
| `.github/workflows/deploy.yml` | CI/CD pipeline                    |
| `deploy.md`                    | This file                         |

---

## Lessons Learned (Real Deployment Issues)

### 1. Instance Type Matters for Building

`t2.micro` (1GB RAM) **cannot build this project**. Docker build OOM kills during `bun install` and `bunx turbo run build`. Minimum: `t3.medium` (4GB RAM).

**Symptoms:**
- `signal: killed` during build
- Build hangs for 900+ seconds then fails

**Fix:** Upgrade to `t3.medium` via EC2 console → Stop → Change Instance Type → Start.

### 2. `.dockerignore` Must Be Careful

Excluding the wrong files breaks the build. The Dockerfile needs these files in the build context:

**Must KEEP (do NOT exclude):**
- `package.json`, `bun.lock` — for `bun install`
- `apps/*/package.json`, `packages/*/package.json` — workspace setup
- `packages/db/schema.prisma` — for `prisma generate`
- `turbo.json` — for `turbo run build`
- `tsconfig.json`, `eslint.config.js` — may be needed during build

**Safe to exclude:**
- `**/node_modules`, `**/.next`, `**/dist`, `**/build`
- `.git`, `.env`, `.env*.local`, `**/.turbo`
- `tests`, `scripts`, `infra`, `monitoring`
- `*.md`, `*.yaml`, `*.yml`, `nginx.conf`
- `.vscode`, `.idea`, `*.log`, `coverage`, `.github`

**Symptom of bad `.dockerignore`:**
```
Could not find turbo.json or turbo.jsonc
```
or
```
/package.json: not found
```

### 3. EC2 Public IP Changes on Stop/Start

When you stop/start or change instance type, the **public IP changes**. You must update:

1. **GitHub Actions secrets** → `HOST` value
2. **Your SSH config** on local machine
3. **Any hardcoded IPs** in configs

Find new IP: EC2 Console → Instances → check Public IPv4 address.

### 4. Disk Fills Up Fast with Docker

Docker images + build cache can consume 10-15GB on a 19GB volume. Regular cleanup:

```bash
# Check disk usage
df -h /

# Clean everything (images, volumes, cache)
docker system prune -a --volumes -f

# Check what's using space
docker system df
```

**Recommended:** Use 30GB+ gp3 volume for production.

### 5. Build Context Size Affects Speed

Large build context = slow transfers. First build had 83MB context taking 21 minutes just to transfer.

```bash
# Check context size during build
docker compose --env-file .env build 2>&1 | grep "transferring context"
```

With proper `.dockerignore`, context drops to ~16KB — transfers in under 1 second.

### 6. Lint Warnings = Build Failures in CI

`next lint` with `--max-warnings 0` means any warning fails the build. Common issues:

- Unused imports (`useCallback`, `apiFetch`)
- Unused variables (`logout`, `userLoading`, `Me` type)

Fix: Remove unused imports/variables before pushing.

### 7. EBS Volume Needs Manual Resize

**Problem:** Expanded EBS volume from AWS console but `df -h` still shows old size.

**Fix:** SSH into instance and resize the filesystem:
```bash
sudo growpart /dev/nvme0n1 1
sudo resize2fs /dev/nvme0n1p1
```

**Lesson:** AWS console expands the volume, but the OS filesystem needs manual resize.

### 8. SSL Requires Port 443 in Both Security Group and Docker

**Problem:** Cloudflare 521/522 errors even after certbot succeeds.

**Fix:** Both must be configured:
1. Security group: Add HTTPS (443) inbound rule
2. docker-compose.yml: Add `"443:443"` to nginx ports
3. nginx.conf: Add SSL server block with cert paths

### 9. Lint Warnings = Build Failures in CI

`next lint` with `--max-warnings 0` means any warning fails the build. Common issues:

- Unused imports (`useCallback`, `apiFetch`)
- Unused variables (`logout`, `userLoading`, `Me` type)

Fix: Remove unused imports/variables before pushing.

## Files Modified During Deployment

| File | Change |
|------|--------|
| `.dockerignore` | Added recursive exclusions, removed turbo.json etc. |
| `Dockerfile` | Added `# syntax=docker/dockerfile:1`, bun cache mount, packages/config workspace support |
| `docker-compose.yml` | Added port 443, cert volume mount for nginx |
| `nginx.conf` | Added SSL server block, HTTP→HTTPS redirect |
| `apps/web/app/medical/page.tsx` | Removed unused `logout` |
| `apps/web/app/notifications/page.tsx` | Removed unused `apiFetch`, `Me`, `userLoading` |
| `apps/web/app/resources/page.tsx` | Removed unused `useCallback`, `Me` |
| `packages/config/` | New workspace package for centralized env loading |
| `apps/be/lib/outbox.ts` | Transactional outbox helper |
| `apps/be/kafka/workers/outboxRelay.ts` | Outbox relay with DLQ promotion |
| `apps/be/kafka/workers/esReconciliation.ts` | Periodic ES reconciliation worker |
| `apps/ws/handlers.ts` | Message durability + sync pagination |
| `deploy.md` | Added lessons learned section |

---
