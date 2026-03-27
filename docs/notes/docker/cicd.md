---
title: Docker 与 CI/CD
description: 在持续集成和持续部署中使用 Docker
---

# Docker 与 CI/CD

## Docker 在 CI/CD 中的角色

```
代码提交 → CI 构建 Docker 镜像 → 推送到镜像仓库 → CD 部署新版本
```

Docker 在 CI/CD 中的价值：

- **环境一致性**：CI 中构建的镜像与生产环境完全一致
- **可重复构建**：任何时间、任何地点都能产出相同的镜像
- **版本管理**：每个镜像有唯一标识（标签、SHA）
- **快速回滚**：回退到上一个镜像版本即可

## GitHub Actions 集成

### 基本构建与推送

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## 镜像版本管理策略

### 标签命名规范

```bash
# 语义化版本
my-app:1.0.0
my-app:1.0
my-app:1

# Git SHA（精确追溯）
my-app:sha-a1b2c3d

# 环境标签
my-app:production
my-app:staging

# latest 指向最新稳定版
my-app:latest
```

### 多标签推送

```bash
# 同时打多个标签
docker build -t my-app:1.0.0 -t my-app:1.0 -t my-app:latest .
docker push my-app:1.0.0
docker push my-app:1.0
docker push my-app:latest
```

## 多架构构建

使用 `docker buildx` 构建支持多平台的镜像：

```bash
# 创建 buildx 构建器
docker buildx create --name mybuilder --use

# 构建并推送多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t my-app:1.0.0 \
  --push .
```

::: tip
Apple Silicon（M1/M2/M3）用户开发的镜像，如果不指定 `--platform linux/amd64`，在 Intel 服务器上可能无法运行。多架构构建可以解决这个问题。
:::

## 镜像仓库选择

| 仓库 | 特点 | 适用场景 |
|------|------|---------|
| Docker Hub | 最大公共仓库，免费 1 个私有仓库 | 开源项目、个人项目 |
| GitHub Container Registry (ghcr.io) | 与 GitHub 深度集成 | GitHub 项目 |
| AWS ECR | AWS 生态集成 | AWS 部署 |
| Alibaba ACR | 国内访问快 | 国内项目 |
| Harbor | 私有部署，功能丰富 | 企业内部 |

## 安全最佳实践

### 1. 不在镜像中存放敏感信息

```dockerfile
# ❌ 错误：密码写入镜像
ENV DB_PASSWORD=secret123

# ✅ 正确：运行时通过环境变量注入
# docker run -e DB_PASSWORD=secret123 my-app
```

### 2. 使用 .dockerignore 排除敏感文件

```text
.env
.env.*
*.key
*.pem
credentials.json
```

### 3. 镜像扫描

```bash
# 使用 Docker Scout 扫描漏洞
docker scout cves my-app:latest

# 使用 Trivy 扫描
trivy image my-app:latest
```

### 4. 使用最小基础镜像

```dockerfile
# 优先选择 slim/alpine/distroless
FROM node:20-alpine      # ~50MB
FROM node:20-slim        # ~200MB
# 而非
FROM node:20              # ~1GB
```

### 5. 以非 root 用户运行

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "server.js"]
```

## GitLab CI 示例

```yaml
# .gitlab-ci.yml
stages:
  - build
  - push

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
```
