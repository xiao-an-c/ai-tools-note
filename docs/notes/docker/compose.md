---
title: Docker Compose
description: 定义和运行多容器应用
---

# Docker Compose

## 什么是 Docker Compose

Docker Compose 是定义和运行多容器应用的工具。通过一个 YAML 文件配置所有服务，一条命令即可启动整个应用栈。

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down
```

## 安装

- **macOS / Windows**：Docker Desktop 已内置，无需额外安装
- **Linux**：作为 Docker 插件安装（`docker-compose-plugin`）

```bash
# 验证安装
docker compose version
```

::: tip
新版 Docker Compose 使用 `docker compose`（空格）命令，旧版独立安装的使用 `docker-compose`（横线）。推荐使用新版。
:::

## compose.yaml 基本结构

```yaml
services:
  web:
    image: nginx:1.25
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    depends_on:
      - api

  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: myapp
    volumes:
      - db-data:/var/lib/mysql

  redis:
    image: redis:7
    volumes:
      - redis-data:/data

volumes:
  db-data:
  redis-data:
```

顶层键说明：
- **services**：定义各个容器服务
- **networks**：自定义网络（可选，不配置则自动创建默认网络）
- **volumes**：具名数据卷

## 常用配置项

### build - 构建配置

```yaml
services:
  app:
    # 指定 Dockerfile 所在目录
    build: .

    # 完整写法
    build:
      context: .
      dockerfile: Dockerfile.prod
      args:
        VERSION: "1.0"
      target: production  # 多阶段构建目标阶段
```

### ports - 端口映射

```yaml
ports:
  - "8080:80"          # 主机:容器
  - "127.0.0.1:3000:3000"  # 绑定地址
  - "9090-9091:8080-8081"  # 端口范围
```

### environment - 环境变量

```yaml
environment:
  - DB_HOST=db
  - DB_PORT=3306
  # 或键值对格式
  DB_HOST: db
  DB_PORT: 3306
```

### env_file - 环境变量文件

```yaml
env_file:
  - .env
  - .env.local
```

### volumes - 数据卷

```yaml
volumes:
  - db-data:/var/lib/mysql       # 具名 Volume
  - ./src:/app/src               # Bind Mount
  - ./config:/etc/app:ro         # 只读挂载
```

### depends_on - 依赖关系

```yaml
depends_on:
  db:
    condition: service_healthy   # 等待 db 健康检查通过
  redis:
    condition: service_started   # 只等启动完成
```

### restart - 重启策略

```yaml
restart: always           # 总是重启
restart: unless-stopped   # 手动停止外都重启
restart: on-failure       # 异常退出时重启
restart: "no"             # 不重启（默认）
```

### healthcheck - 健康检查

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 常用命令

```bash
# 启动（后台运行）
docker compose up -d

# 启动并重新构建镜像
docker compose up -d --build

# 停止并删除容器、网络
docker compose down

# 停止并删除容器、网络、Volume
docker compose down -v

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs
docker compose logs -f web     # 跟踪指定服务日志
docker compose logs --tail 50  # 最后 50 行

# 在服务中执行命令
docker compose exec web bash
docker compose exec db mysql -uroot -p

# 构建镜像
docker compose build
docker compose build --no-cache

# 拉取镜像
docker compose pull

# 扩容（启动多个实例）
docker compose up -d --scale worker=3

# 查看服务配置
docker compose config
```

## 环境变量

### .env 文件

在项目根目录创建 `.env` 文件，Compose 自动加载：

```bash
# .env
COMPOSE_PROJECT_NAME=myapp
DB_PASSWORD=secret
APP_PORT=3000
NODE_ENV=production
```

```yaml
# compose.yaml 中引用
services:
  app:
    ports:
      - "${APP_PORT}:3000"
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
```

### 变量优先级（从高到低）

1. `docker compose run -e` 命令行指定
2. Shell 环境变量
3. `.env` 文件
4. `compose.yaml` 中的默认值

## 实战示例：Web 应用 + 数据库

项目结构：

```
my-project/
├── compose.yaml
├── .env
├── app/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── nginx/
    └── default.conf
```

compose.yaml：

```yaml
services:
  # Web 服务器
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "${WEB_PORT:-80}:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped

  # 应用服务
  app:
    build: ./app
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=${DB_NAME:-myapp}
      - DB_USER=${DB_USER:-root}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_URL=redis://redis:6379
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  # 数据库
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME:-myapp}
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # 缓存
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  mysql-data:
  redis-data:
```

使用方式：

```bash
# 启动所有服务
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f app

# 停止
docker compose down
```

## Compose 文件拆分

大型项目可以将 Compose 配置拆分为多个文件：

```bash
# 基础配置：compose.yaml
# 开发覆盖：compose.override.yaml（自动加载）
# 生产配置：compose.prod.yaml

# 使用生产配置
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

compose.override.yaml（自动合并）：

```yaml
services:
  app:
    build:
      target: development
    volumes:
      - ./app/src:/app/src  # 开发热更新
    environment:
      - NODE_ENV=development
    ports:
      - "9229:9229"  # 调试端口
```

compose.prod.yaml：

```yaml
services:
  app:
    build:
      target: production
    environment:
      - NODE_ENV=production
```
