---
title: 常见问题与排查
---

# 常见问题与排查

## 容器启动失败

### 查看退出码

```bash
# 查看容器退出码
docker ps -a --format "table {{.Names}}\t{{.Status}}"
docker inspect --format='{{.State.ExitCode}}' my-container
```

### 常见退出码

| 退出码 | 含义 | 排查方向 |
|--------|------|---------|
| 0 | 正常退出 | 检查 CMD 是否执行完毕就退出了 |
| 1 | 应用错误 | `docker logs` 查看应用报错 |
| 137 | OOMKilled（内存不足被杀） | 增加内存限制或优化内存使用 |
| 139 | Segmentation Fault | 应用 bug，检查依赖兼容性 |
| 143 | SIGTERM 正常停止 | 正常现象 |
| 125 | Docker 宛如失败 | 检查 Docker 守护进程 |

### 排查步骤

```bash
# 1. 查看容器日志
docker logs my-container
docker logs --tail 100 my-container

# 2. 查看详细信息
docker inspect my-container

# 3. 交互式运行排查
docker run -it --rm my-image sh

# 4. 查看容器事件
docker events --since 1h
```

## 端口冲突

```bash
# 症状：Bind for 0.0.0.0:8080 failed: port is already allocated

# 查看端口占用
lsof -i :8080
# 或
netstat -tlnp | grep 8080
# 或 (macOS)
lsof -iTCP:8080 -sTCP:LISTEN

# 解决方案：换一个主机端口
docker run -d -p 8081:80 nginx

# 或停止占用端口的容器
docker ps --format "table {{.Names}}\t{{.Ports}}"
docker stop <占用端口的容器>
```

## 磁盘空间不足

### 检查磁盘使用

```bash
# 查看 Docker 整体磁盘使用
docker system df

# 查看详细信息
docker system df -v
```

### 清理命令

```bash
# 清理所有未使用资源（已停止的容器、悬空镜像、未使用网络）
docker system prune

# 清理所有（包括未使用的镜像）
docker system prune -a

# 只清理特定类型
docker container prune   # 已停止的容器
docker image prune       # 悬空镜像
docker image prune -a    # 所有未使用镜像
docker volume prune      # 未使用的 Volume
docker network prune     # 未使用的网络
docker builder prune     # 构建缓存

# 按时间清理（最近 24 小时未使用的）
docker image prune --filter "until=24h"
```

::: warning
`docker system prune -a` 会删除所有没有运行容器的镜像。下次启动需要重新拉取。执行前建议先 `docker system df` 确认清理范围。
:::

## 权限问题

### Volume 挂载权限

```bash
# 症状：容器内无法写入挂载目录
# Permission denied

# 原因：容器内用户 UID 与主机目录权限不匹配

# 解决方案 1：指定用户运行
docker run --user $(id -u):$(id -g) my-app

# 解决方案 2：修改主机目录权限
chmod -R 777 /host/data  # 不推荐生产使用

# 解决方案 3：在 Dockerfile 中创建匹配的用户
ARG UID=1000
ARG GID=1000
RUN addgroup -g ${GID} appgroup && \
    adduser -u ${UID} -G appgroup -S appuser
USER appuser
```

## 网络连接问题

### DNS 解析失败

```bash
# 症状：容器内无法解析域名
docker exec my-container ping google.com
# ping: bad address 'google.com'

# 检查容器 DNS 配置
docker exec my-container cat /etc/resolv.conf

# 指定 DNS
docker run -d --dns 8.8.8.8 --dns 8.8.4.4 my-app
```

### 容器间无法通信

```bash
# 确认容器在同一网络
docker network inspect my-network

# 将容器加入网络
docker network connect my-network my-container

# 检查防火墙规则
sudo iptables -L -n
```

## 镜像构建失败

### 缓存问题

```bash
# 强制不使用缓存重新构建
docker build --no-cache -t my-app .

# 清理构建缓存
docker builder prune
```

### 构建上下文过大

```bash
# 症状：Sending build context to Docker daemon  2.1GB

# 检查是否有大文件被包含
# 添加 .dockerignore 排除不需要的文件
echo "node_modules\ndist\n.git\n*.log" >> .dockerignore
```

## macOS 性能问题

macOS 上 Docker 的文件系统性能（尤其是 Bind Mount）可能较慢：

### 优化方案

```bash
# 1. 使用 :cached 或 :delegated 挂载选项
docker run -v $(pwd)/src:/app/src:cached my-app
docker run -v $(pwd)/src:/app/src:delegated my-app

# 2. 使用 Docker Volume 代替 Bind Mount（性能更好）
docker volume create my-data
docker run -v my-data:/app/data my-app

# 3. 开启 Docker Desktop VirtioFS（推荐）
# Settings → General → Choose file sharing implementation → VirtioFS
```

| 选项 | 一致性 | 性能 | 适用场景 |
|------|--------|------|---------|
| 默认 (consistent) | 最强 | 最慢 | 需要严格一致性 |
| `:cached` | 容器读取可能延迟 | 较快 | 前端开发 |
| `:delegated` | 主机读取可能延迟 | 最快 | CI 构建 |

## 常用调试命令速查

| 命令 | 用途 |
|------|------|
| `docker logs <容器>` | 查看容器日志 |
| `docker logs -f <容器>` | 实时跟踪日志 |
| `docker exec -it <容器> sh` | 进入容器终端 |
| `docker inspect <容器>` | 查看容器详情 |
| `docker events` | 实时查看 Docker 事件 |
| `docker stats` | 查看容器资源占用 |
| `docker system df` | 查看 Docker 磁盘使用 |
| `docker network ls` | 列出网络 |
| `docker volume ls` | 列出数据卷 |
| `docker top <容器>` | 查看容器内进程 |

## 清理命令速查

| 命令 | 清理内容 |
|------|---------|
| `docker system prune` | 已停止容器、悬空镜像、未用网络 |
| `docker system prune -a` | 上述 + 所有未使用镜像 |
| `docker system prune --volumes` | 上述 + 未使用 Volume |
| `docker container prune` | 已停止的容器 |
| `docker image prune` | 悬空镜像（`<none>`） |
| `docker image prune -a` | 所有未使用的镜像 |
| `docker volume prune` | 未使用的 Volume |
| `docker builder prune` | 构建缓存 |
