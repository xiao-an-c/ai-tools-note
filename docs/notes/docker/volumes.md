---
title: 数据持久化
description: Volume 和 Bind Mount 的使用方法
---

# 数据持久化

## 为什么需要数据持久化

容器的文件系统是临时的。当容器被删除时，其内部的所有数据都会丢失。对于数据库、用户上传文件等需要持久保存的数据，必须使用外部存储。

```
容器删除 → 可写层数据全部丢失 ❌
              ↓
使用 Volume/Bind Mount → 数据保存在容器外部 ✅
```

## 三种挂载方式

```
┌─────────────────────────────────────────┐
│              Docker 容器                 │
│                                         │
│   /app/data ←── Volume（Docker 管理）    │
│   /app/src  ←── Bind Mount（主机目录）   │
│   /tmp      ←── tmpfs（内存）           │
│                                         │
└─────────────────────────────────────────┘
      │              │            │
      ▼              ▼            ✗ (不存在于磁盘)
 Docker 区域     主机文件系统
```

| 类型 | 存储位置 | 管理方式 | 适用场景 |
|------|---------|---------|---------|
| Volume | Docker 管理的区域 | Docker 命令 | 数据库、持久化数据 |
| Bind Mount | 主机任意目录 | 主机路径 | 开发热更新、配置文件 |
| tmpfs | 内存 | 自动 | 临时敏感数据 |

## Volume（Docker 管理）

Volume 是 Docker 推荐的持久化方式，由 Docker 统一管理。

### 创建与查看

```bash
# 创建 Volume
docker volume create my-data

# 列出所有 Volume
docker volume ls

# 查看 Volume 详情
docker volume inspect my-data
```

### 使用 Volume

```bash
# 方式一：-v 参数（推荐，更简洁）
docker run -d \
  --name mysql \
  -v my-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8.0

# 方式二：--mount 参数（更明确）
docker run -d \
  --name mysql \
  --mount type=volume,source=my-data,target=/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8.0
```

### 删除 Volume

```bash
# 删除指定 Volume
docker volume rm my-data

# 删除所有未使用的 Volume
docker volume prune

# 删除容器时同时删除关联的匿名 Volume
docker rm -v my-container
```

::: tip
推荐使用 `-v volume_name:/path` 语法（具名 Volume），这样 Volume 有明确名称，便于管理和识别。
:::

## Bind Mount（主机目录挂载）

将主机上的目录直接挂载到容器中。

### 基本用法

```bash
# -v 语法
docker run -d \
  -v /host/path:/container/path \
  nginx:1.25

# --mount 语法
docker run -d \
  --mount type=bind,source=/host/path,target=/container/path \
  nginx:1.25
```

### 只读挂载

```bash
# 添加 :ro 使容器只能读取，不能写入
docker run -d \
  -v /host/config:/etc/nginx/conf.d:ro \
  nginx:1.25
```

### 开发环境热更新

```bash
# 挂载源代码目录，代码修改后容器内立即可见
docker run -d \
  -v $(pwd)/src:/app/src \
  -p 3000:3000 \
  node:20 \
  sh -c "cd /app && npm start"
```

::: warning
Bind Mount 会直接暴露主机文件系统给容器。如果容器内的进程修改了挂载目录中的文件，主机上的文件也会被修改。使用 `:ro` 可以限制为只读。
:::

## tmpfs Mount（内存存储）

数据只存储在内存中，容器停止后数据消失。仅支持 Linux。

```bash
docker run -d \
  --mount type=tmpfs,target=/app/tmp \
  nginx:1.25

# 指定大小限制
docker run -d \
  --mount type=tmpfs,target=/app/tmp,tmpfs-size=100m \
  nginx:1.25
```

适用场景：
- 存储临时敏感数据（如加密密钥）
- 高性能临时文件处理

## 数据备份与恢复

### 备份 Volume

```bash
# 使用临时容器将 Volume 数据打包
docker run --rm \
  -v my-data:/source:ro \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/my-data-backup.tar.gz -C /source .
```

### 恢复 Volume

```bash
# 从备份文件恢复数据到 Volume
docker run --rm \
  -v my-data:/target \
  -v $(pwd)/backup:/backup:ro \
  alpine sh -c "cd /target && tar xzf /backup/my-data-backup.tar.gz"
```

## 实战示例

### MySQL 数据持久化

```bash
# 1. 创建 Volume
docker volume create mysql-data

# 2. 启动 MySQL 容器
docker run -d \
  --name mysql \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=myapp \
  -p 3306:3306 \
  mysql:8.0

# 3. 即使删除容器，数据不会丢失
docker rm -f mysql

# 4. 重新创建容器，使用相同 Volume
docker run -d \
  --name mysql \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -p 3306:3306 \
  mysql:8.0
# 数据库和之前的数据都还在！
```

### 开发环境（代码热更新）

```bash
# 前端开发：挂载源代码，修改即生效
docker run -it --rm \
  -v $(pwd):/app \
  -p 3000:3000 \
  -w /app \
  node:20 \
  sh -c "npm install && npm run dev"
```

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `docker volume create <name>` | 创建 Volume |
| `docker volume ls` | 列出所有 Volume |
| `docker volume inspect <name>` | 查看 Volume 详情 |
| `docker volume rm <name>` | 删除 Volume |
| `docker volume prune` | 清理未使用的 Volume |
| `-v name:/path` | 使用具名 Volume |
| `-v /host:/container` | Bind Mount |
| `-v /host:/container:ro` | 只读 Bind Mount |
