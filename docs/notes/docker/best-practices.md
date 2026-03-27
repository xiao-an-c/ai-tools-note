---
title: Docker 最佳实践
description: 生产环境 Docker 使用建议
---

# Docker 最佳实践

## 镜像优化

### 减小镜像体积

```dockerfile
# 1. 选择精简基础镜像
FROM node:20-alpine     # ~50MB 而非 node:20 的 ~1GB

# 2. 合并 RUN 命令减少层数
RUN apk add --no-cache curl git && \
    npm install -g pnpm

# 3. 清理安装缓存
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 4. 使用多阶段构建
# 详见[多阶段构建](./multi-stage)

# 5. 利用构建缓存
COPY package*.json ./
RUN npm ci
COPY . .
```

### 常用基础镜像对比

| 基础镜像 | 大小 | 包管理器 | 适用场景 |
|---------|------|---------|---------|
| `scratch` | 0B | 无 | 静态编译的 Go/Rust 二进制 |
| `distroless` | ~2MB | 无 | 安全要求高的生产环境 |
| `alpine` | ~5MB | apk | 通用精简镜像 |
| `*-slim` | ~80-200MB | apt | 需要完整 glibc 的场景 |
| 完整版 | ~1GB+ | 完整 | 开发调试 |

## 安全建议

### 非 root 用户运行

```dockerfile
FROM node:20-alpine

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup . .

USER appuser

CMD ["node", "server.js"]
```

### 只读文件系统

```bash
docker run --read-only --tmpfs /tmp --tmpfs /run my-app
```

### 镜像漏洞扫描

```bash
# Docker Scout（Docker Desktop 内置）
docker scout cves my-app:latest
docker scout recommendations my-app:latest

# Trivy
trivy image my-app:latest
```

## 日志管理

### 配置日志驱动

```bash
# 启动容器时限制日志大小
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  my-app
```

### Docker Compose 日志配置

```yaml
services:
  app:
    image: my-app
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

::: tip
不配置日志限制，容器的 JSON 日志文件会无限增长，最终占满磁盘。
:::

## 资源限制

防止单个容器占用过多资源：

### Docker run

```bash
# 内存限制
docker run -d --memory=512m --memory-swap=1g my-app

# CPU 限制
docker run -d --cpus=1.5 my-app

# 组合使用
docker run -d \
  --memory=512m \
  --cpus=1.0 \
  --pids-limit=100 \
  my-app
```

### Docker Compose

```yaml
services:
  app:
    image: my-app
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 健康检查

### Dockerfile HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Docker Compose

```yaml
services:
  app:
    image: my-app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

### 查看健康状态

```bash
docker inspect --format='{{.State.Health.Status}}' my-app
```

## 开发环境建议

### 使用 Bind Mount 实现热更新

```yaml
services:
  app:
    build:
      context: .
      target: development
    volumes:
      - ./src:/app/src         # 代码热更新
      - ./tests:/app/tests     # 测试文件
    environment:
      - NODE_ENV=development
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js 调试端口
```

### 使用 compose.override.yml

`compose.override.yml` 自动与 `compose.yaml` 合并，适合存放开发专用配置：

```yaml
# compose.override.yaml（自动加载）
services:
  app:
    command: npm run dev
    volumes:
      - ./src:/app/src
    environment:
      - NODE_ENV=development

  adminer:
    image: adminer
    ports:
      - "8080:8080"
```

## 生产环境建议

### 重启策略

```yaml
services:
  app:
    restart: unless-stopped  # 生产环境推荐
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### 使用特定标签

```yaml
# ❌ 不推荐
image: nginx:latest

# ✅ 推荐
image: nginx:1.25.4
```

## Dockerfile 模板

### Node.js 应用

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Python 应用

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
USER nobody
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

### Go 应用

```dockerfile
FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server .

FROM scratch
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```

### Nginx 静态站点

```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
