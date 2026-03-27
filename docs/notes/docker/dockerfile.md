---
title: Dockerfile 详解
description: 从零编写 Dockerfile 构建自定义镜像
---

# Dockerfile 详解

## 什么是 Dockerfile

Dockerfile 是一个文本文件，包含构建 Docker 镜像所需的全部指令。通过 `docker build` 命令读取 Dockerfile 来构建镜像。

```bash
# 构建镜像
docker build -t my-app:v1.0 .

# -t: 指定名称和标签
# .: 构建上下文路径（当前目录）
```

## 基本结构

一个典型 Dockerfile 的结构：

```dockerfile
# 1. 基础镜像
FROM node:20-alpine

# 2. 设置工作目录
WORKDIR /app

# 3. 复制依赖文件并安装
COPY package*.json ./
RUN npm ci --only=production

# 4. 复制源代码
COPY . .

# 5. 声明端口
EXPOSE 3000

# 6. 定义启动命令
CMD ["node", "server.js"]
```

## 指令详解

### FROM - 基础镜像

每个 Dockerfile 必须以 `FROM` 开头（除了 ARG）。

```dockerfile
# 使用官方镜像
FROM python:3.12

# 使用精简版
FROM node:20-alpine

# 多阶段构建中可多次使用 FROM
FROM golang:1.22 AS builder
```

### RUN - 执行命令

在镜像构建时执行命令，结果会形成新的镜像层。

```dockerfile
# Shell 格式
RUN apt-get update && apt-get install -y curl

# Exec 格式
RUN ["apt-get", "install", "-y", "curl"]

# 合并命令减少层数（推荐）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        git \
        vim && \
    rm -rf /var/lib/apt/lists/*
```

::: tip
将多个命令用 `&&` 合并到一个 RUN 中，并在最后清理缓存，可以显著减小镜像体积。
:::

### COPY vs ADD - 复制文件

```dockerfile
# COPY - 推荐使用，语义清晰
COPY app.py /app/app.py
COPY ./src /app/src

# ADD - 额外支持 URL 下载和自动解压 tar
ADD https://example.com/file.tar.gz /app/
ADD archive.tar.gz /app/  # 自动解压
```

| 特性 | COPY | ADD |
|------|------|-----|
| 复制本地文件 | 是 | 是 |
| 支持 URL | 否 | 是 |
| 自动解压 tar | 否 | 是 |
| 推荐程度 | 推荐 | 仅在需要解压时使用 |

### CMD vs ENTRYPOINT - 启动命令

```dockerfile
# CMD - 提供默认命令，可被 docker run 参数覆盖
CMD ["node", "server.js"]
CMD ["python", "app.py"]

# ENTRYPOINT - 固定入口点，CMD 作为参数传入
ENTRYPOINT ["python"]
CMD ["app.py"]
# docker run my-image script.py  → 实际执行: python script.py
```

| 特性 | CMD | ENTRYPOINT |
|------|-----|-----------|
| 可被覆盖 | 是（docker run 参数直接覆盖） | 需要加 `--entrypoint` 才能覆盖 |
| 用途 | 提供默认命令 | 固定入口程序 |
| 组合使用 | 作为 ENTRYPOINT 的默认参数 | 定义可执行程序 |

```dockerfile
# 常见模式：ENTRYPOINT + CMD 组合
ENTRYPOINT ["node"]
CMD ["--help"]
# docker run my-app server.js  → node server.js
# docker run my-app             → node --help
```

### ENV vs ARG - 环境变量

```dockerfile
# ENV - 运行时环境变量，会保留到容器中
ENV NODE_ENV=production
ENV APP_PORT=3000

# ARG - 构建时变量，不会保留到最终镜像
ARG VERSION=1.0
RUN echo "Building version $VERSION"

# ARG 可在 FROM 之前使用
ARG BASE_IMAGE=node:20
FROM $BASE_IMAGE
```

| 特性 | ENV | ARG |
|------|-----|-----|
| 生效阶段 | 运行时 | 构建时 |
| 容器中可用 | 是 | 否 |
| 可在 FROM 前使用 | 否 | 是 |
| `docker run -e` 覆盖 | 可以 | 不适用 |
| `docker build --build-arg` 覆盖 | 不可以 | 可以 |

### WORKDIR - 工作目录

```dockerfile
WORKDIR /app

# 后续指令都在 /app 下执行
COPY . .
RUN npm install
# 相当于在 /app 目录下执行 npm install
```

::: tip
使用 `WORKDIR` 而非 `RUN cd /app`。`RUN cd` 只在当前层生效，下一层会回到根目录。
:::

### EXPOSE - 声明端口

```dockerfile
EXPOSE 3000
EXPOSE 80/tcp
EXPOSE 443
```

::: warning
`EXPOSE` 只是文档声明，并不会自动发布端口。运行时仍需要 `-p` 参数映射端口。
:::

### VOLUME - 声明挂载点

```dockerfile
VOLUME /data
VOLUME ["/data", "/logs"]
```

运行时如果没有指定 `-v`，Docker 会自动创建一个匿名卷。

### 其他指令

```dockerfile
# LABEL - 添加元数据
LABEL maintainer="dev@example.com"
LABEL version="1.0"
LABEL description="My web application"

# USER - 指定运行用户
RUN adduser -D appuser
USER appuser

# HEALTHCHECK - 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/ || exit 1

# SHELL - 更改默认 shell
SHELL ["/bin/bash", "-c"]
```

## 构建镜像

```bash
# 基本构建
docker build -t my-app:v1.0 .

# 指定 Dockerfile
docker build -f Dockerfile.prod -t my-app:v1.0 .

# 传递构建参数
docker build --build-arg VERSION=2.0 -t my-app:v2.0 .

# 不使用缓存
docker build --no-cache -t my-app:v1.0 .

# 指定平台
docker build --platform linux/amd64 -t my-app:v1.0 .
```

### 构建上下文

`docker build` 最后的 `.` 是构建上下文路径，Docker 会将该目录下所有文件发送给 Docker Daemon。这也是为什么 `.dockerignore` 很重要。

## 构建缓存

Docker 会缓存每一层，如果某一层没变化，直接使用缓存：

```dockerfile
# ❌ 错误示范：源代码变化导致 npm install 重新执行
COPY . .
RUN npm install

# ✅ 正确示范：先复制 package.json，只有依赖变化时才重新安装
COPY package*.json ./
RUN npm install
COPY . .
```

**原则**：将变化频率低的指令放在前面，变化频率高的放在后面。

## .dockerignore

类似 `.gitignore`，排除不需要发送到构建上下文的文件：

```text
node_modules
npm-debug.log
.git
.github
.env
.env.*
*.md
.vscode
.idea
dist
build
Dockerfile
docker-compose*.yml
.dockerignore
```

::: tip
`.dockerignore` 可以大幅加快构建速度，避免将不必要的文件发送给 Docker Daemon。同时也能防止 `.env` 等敏感文件被意外复制到镜像中。
:::

## 最佳实践

1. **使用官方镜像作为基础**，优先选择 Alpine 版本以减小体积
2. **合并 RUN 命令**减少镜像层数
3. **按变化频率排序**指令（低频在前，高频在后）
4. **使用明确的标签**，不要用 `latest`
5. **不安装不必要的包**
6. **清理构建缓存**（`rm -rf /var/lib/apt/lists/*`、`npm cache clean --force`）
7. **使用非 root 用户**运行应用
8. **利用构建缓存**，先复制依赖文件再复制源代码
