---
title: 容器操作
---

# 容器操作

## 创建与启动

`docker run` 是最常用的命令，它创建并启动一个新容器：

```bash
# 基本用法
docker run nginx:1.25

# 常用参数组合
docker run -d \              # 后台运行
  --name my-nginx \          # 容器名称
  -p 8080:80 \               # 端口映射（主机:容器）
  -v /host/data:/data \      # 挂载卷
  -e NODE_ENV=production \   # 环境变量
  --restart unless-stopped \ # 重启策略
  nginx:1.25
```

### 常用参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `-d` | 后台运行（ detached 模式） | `docker run -d nginx` |
| `--name` | 指定容器名称 | `--name my-app` |
| `-p` | 端口映射 | `-p 8080:80` |
| `-v` | 挂载卷 | `-v /data:/app/data` |
| `-e` | 设置环境变量 | `-e DB_HOST=mysql` |
| `--rm` | 容器停止后自动删除 | `--rm` |
| `-it` | 交互模式 + 终端 | `-it ubuntu bash` |
| `--restart` | 重启策略 | `--restart always` |
| `--network` | 指定网络 | `--network my-net` |
| `--platform` | 指定平台 | `--platform linux/amd64` |

::: tip
`--rm` 参数非常适合一次性任务，容器停止后自动清理，不会留下已停止的容器。
:::

### 重启策略

| 策略 | 说明 |
|------|------|
| `no` | 不自动重启（默认） |
| `always` | 总是重启，包括 Docker 守护进程启动时 |
| `unless-stopped` | 类似 always，但手动停止后不会重启 |
| `on-failure[:max-retries]` | 仅当容器异常退出时重启 |

## 查看容器

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a

# 只显示容器 ID
docker ps -q

# 显示容器大小
docker ps -s

# 按状态过滤
docker ps --filter "status=exited"

# 按名称过滤
docker ps --filter "name=my-nginx"

# 自定义输出格式
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## 容器日志

```bash
# 查看容器日志
docker logs my-nginx

# 实时跟踪日志（类似 tail -f）
docker logs -f my-nginx

# 显示最后 100 行
docker logs --tail 100 my-nginx

# 显示时间戳
docker logs -t my-nginx

# 查看指定时间段的日志
docker logs --since "2024-01-01" --until "2024-01-02" my-nginx
```

## 进入容器

```bash
# 在容器中执行命令（推荐）
docker exec -it my-nginx bash

# 如果容器没有 bash，使用 sh
docker exec -it my-nginx sh

# 以 root 用户进入
docker exec -it -u root my-nginx bash

# 直接执行命令（不进入交互模式）
docker exec my-nginx cat /etc/nginx/nginx.conf
```

### exec vs attach

| 特性 | `docker exec` | `docker attach` |
|------|-------------|----------------|
| 创建新进程 | 是 | 否（连接到主进程） |
| 退出方式 | `exit` 不影响容器 | `Ctrl+C` 会停止容器 |
| 推荐程度 | 推荐 | 不常用 |

::: warning
使用 `docker attach` 时，按 `Ctrl+C` 会停止容器。如果要安全退出，使用 `Ctrl+P, Ctrl+Q`。
:::

## 停止与启动

```bash
# 停止容器（发送 SIGTERM，10 秒后 SIGKILL）
docker stop my-nginx

# 强制停止（直接发送 SIGKILL）
docker kill my-nginx

# 启动已停止的容器
docker start my-nginx

# 重启容器
docker restart my-nginx
```

## 暂停与恢复

```bash
# 暂停容器（冻结进程）
docker pause my-nginx

# 恢复暂停的容器
docker unpause my-nginx
```

## 删除容器

```bash
# 删除已停止的容器
docker rm my-nginx

# 强制删除运行中的容器
docker rm -f my-nginx

# 删除所有已停止的容器
docker container prune

# 删除所有容器（包括运行中的）
docker rm -f $(docker ps -aq)
```

## 文件拷贝

```bash
# 从容器拷贝文件到主机
docker cp my-nginx:/etc/nginx/nginx.conf ./nginx.conf

# 从主机拷贝文件到容器
docker cp ./app.conf my-nginx:/etc/nginx/conf.d/

# 拷贝整个目录
docker cp my-nginx:/var/log/nginx/ ./nginx-logs/
```

## 资源监控

```bash
# 实时查看容器资源占用（CPU、内存、网络、磁盘 IO）
docker stats

# 只看指定容器
docker stats my-nginx my-redis

# 不刷新，只显示一次
docker stats --no-stream

# 查看容器内进程
docker top my-nginx
```

## 实战示例：完整的容器生命周期

```bash
# 1. 启动一个 Nginx 容器
docker run -d --name web -p 8080:80 nginx:1.25

# 2. 查看运行状态
docker ps

# 3. 查看日志
docker logs web

# 4. 进入容器修改配置
docker exec -it web bash
# 在容器内:
# echo "<h1>Hello Docker</h1>" > /usr/share/nginx/html/index.html
# exit

# 5. 验证修改（主机上执行）
curl http://localhost:8080

# 6. 停止容器
docker stop web

# 7. 重新启动
docker start web

# 8. 清理
docker stop web
docker rm web
```
