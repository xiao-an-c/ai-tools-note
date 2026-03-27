---
title: 多阶段构建
description: 使用多阶段构建优化镜像体积
---

# 多阶段构建

## 为什么需要多阶段构建

传统构建中，构建工具（编译器、包管理器）会被打包到最终镜像中。这些工具只在构建时需要，运行时不需要，却白白增加了镜像体积。

```
传统构建：
┌─────────────────────────┐
│   运行时不需要的构建工具   │ ← 200MB+
│   编译中间产物            │ ← 100MB+
│   应用运行时 + 代码       │ ← 50MB
└─────────────────────────┘
镜像总大小: 350MB+

多阶段构建：
┌─────────────────────────┐
│   应用运行时 + 编译产物   │ ← 50MB
└─────────────────────────┘
镜像总大小: 50MB
```

## 基本语法

使用多个 `FROM` 指令，每个 `FROM` 开始一个新的构建阶段：

```dockerfile
# 阶段 1：构建
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段 2：运行
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

关键语法：
- `AS <name>` — 为阶段命名
- `COPY --from=<name>` — 从指定阶段复制文件

## 阶段选择

```bash
# 只构建到指定阶段
docker build --target builder -t my-app:builder .

# 构建完整镜像
docker build -t my-app:latest .
```

适用场景：
- 调试特定构建阶段
- CI 中先构建测试阶段运行测试，再构建生产阶段

## 外部镜像作为来源

`COPY --from` 不仅限于之前定义的阶段，可以从任何镜像复制文件：

```dockerfile
FROM alpine:3.18

# 从 Nginx 镜像复制二进制文件
COPY --from=nginx:1.25 /usr/sbin/nginx /usr/sbin/nginx
COPY --from=nginx:1.25 /etc/nginx /etc/nginx
```

## 实战示例

### Go 应用

Go 编译为静态二进制文件，适合使用 `scratch`（空镜像）：

```dockerfile
# 构建阶段
FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /my-app .

# 运行阶段
FROM scratch
COPY --from=builder /my-app /my-app
EXPOSE 8080
ENTRYPOINT ["/my-app"]
```

体积对比：~1GB → ~10MB

### Node.js 应用

```dockerfile
# 构建阶段
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]
```

体积对比：~1.2GB → ~200MB

### Java 应用

```dockerfile
# 构建阶段
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# 运行阶段
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/my-app-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

体积对比：~800MB → ~200MB

### Python 应用

```dockerfile
# 构建阶段
FROM python:3.12 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# 运行阶段
FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

体积对比：~1.5GB → ~300MB

## 体积对比表

| 技术栈 | 传统构建 | 多阶段构建 | 缩减比例 |
|--------|---------|-----------|---------|
| Go | ~1GB | ~10MB (scratch) | 99% |
| Node.js | ~1.2GB | ~200MB (alpine) | 83% |
| Java | ~800MB | ~200MB (jre-alpine) | 75% |
| Python | ~1.5GB | ~300MB (slim) | 80% |

## 优化技巧

### BuildKit 缓存挂载

使用 `--mount=type=cache` 在构建阶段间共享包管理器缓存：

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build
```

### Secret 挂载

安全地使用构建时凭据：

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20 AS builder
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
# 构建时传入 secret
docker build --secret id=npmrc,src=.npmrc .
```

::: tip
需要在 Dockerfile 开头添加 `# syntax=docker/dockerfile:1` 来启用 BuildKit 特性。Docker Desktop 默认已启用 BuildKit。
:::
