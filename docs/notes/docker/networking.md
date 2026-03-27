---
title: Docker 网络
description: 容器间通信和网络管理
---

# Docker 网络

## Docker 网络模型

Docker 通过 Network Namespace 实现网络隔离。每个容器有独立的网络栈，包括网卡、IP 地址、路由表等。

## 网络驱动类型

| 驱动 | 说明 | 适用场景 |
|------|------|---------|
| bridge | 默认驱动，容器通过虚拟网桥通信 | 单机容器通信 |
| host | 容器直接使用宿主机网络 | 需要最高网络性能 |
| none | 无网络连接 | 安全隔离、离线计算 |
| overlay | 跨主机容器通信 | Docker Swarm 集群 |
| macvlan | 为容器分配物理网络 MAC 地址 | 需要直接接入物理网络 |

## 默认 bridge 网络

安装 Docker 后自动创建 `docker0` 网桥（172.17.0.0/16）：

```bash
# 查看默认网络
docker network ls

# 查看桥接网络详情
docker network inspect bridge
```

::: warning
默认 bridge 网络中，容器之间只能通过 IP 地址通信，**不支持自动 DNS 解析**。推荐使用自定义 bridge 网络。
:::

## 自定义 bridge 网络（推荐）

```bash
# 创建自定义网络
docker network create my-network

# 在自定义网络中启动容器
docker run -d --name app --network my-network my-app
docker run -d --name db --network my-network mysql:8.0

# 容器间可以通过名称通信
# 在 app 容器中可以用 db 作为主机名连接数据库
```

自定义 bridge 网络的优势：
- **自动 DNS 解析**：容器之间可以用名称互相访问
- **隔离性**：不同网络中的容器默认无法通信
- **动态连接**：运行中的容器可以随时加入或离开网络

## 网络管理命令

```bash
# 创建网络
docker network create my-network

# 创建时指定子网
docker network create --subnet=192.168.100.0/24 my-network

# 列出所有网络
docker network ls

# 查看网络详情
docker network inspect my-network

# 将运行中的容器连接到网络
docker network connect my-network my-container

# 将容器从网络断开
docker network disconnect my-network my-container

# 删除网络
docker network rm my-network

# 清理未使用的网络
docker network prune
```

## 端口映射

将容器内部端口暴露给主机：

```bash
# 映射指定端口（主机:容器）
docker run -d -p 8080:80 nginx

# 映射到随机主机端口
docker run -d -p 80 nginx
# 查看映射的端口
docker port <container> 80

# 映射所有声明的端口（EXPOSE 的端口）
docker run -d -P nginx

# 绑定到特定地址
docker run -d -p 127.0.0.1:8080:80 nginx

# 映射多个端口
docker run -d -p 8080:80 -p 8443:443 nginx

# 指定协议（默认 tcp）
docker run -d -p 53:53/udp dns-server
```

## 容器间通信

### 同一网络

```bash
# 创建网络
docker network create app-net

# 启动多个容器
docker run -d --name web --network app-net -p 8080:80 nginx
docker run -d --name api --network app-net my-api
docker run -d --name redis --network app-net redis:7

# 在 web 容器中可以通过名称访问其他容器
docker exec web curl http://api:3000
docker exec web redis-cli -h redis ping
```

### 跨网络通信

不同网络中的容器默认隔离。需要通过 `docker network connect` 建立连接：

```bash
docker network create frontend
docker network create backend

# API 容器同时属于两个网络
docker run -d --name api --network backend my-api
docker network connect frontend api

# frontend 网络中的容器可以访问 api
# backend 网络中的容器也可以访问 api
```

## host 网络模式

容器直接使用宿主机网络，没有网络隔离：

```bash
# 使用 host 网络
docker run -d --network host nginx

# 此时 nginx 直接监听宿主机的 80 端口
# 不需要 -p 端口映射
```

适用场景：需要高性能网络、网络调试工具。

::: warning
host 模式下容器与宿主机共享端口空间，端口冲突会导致启动失败。
:::

## 实战示例：多容器应用网络

```bash
# 1. 创建应用网络
docker network create blog-net

# 2. 启动 MySQL
docker run -d \
  --name mysql \
  --network blog-net \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=blog \
  mysql:8.0

# 3. 启动 Redis
docker run -d \
  --name redis \
  --network blog-net \
  redis:7

# 4. 启动 Web 应用（通过容器名连接数据库和缓存）
docker run -d \
  --name blog-app \
  --network blog-net \
  -p 8080:3000 \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e REDIS_HOST=redis \
  my-blog-app

# blog-app 容器中：
# - mysql:3306 可达 ✅
# - redis:6379 可达 ✅
# - 外部通过 localhost:8080 访问 blog-app ✅
```
