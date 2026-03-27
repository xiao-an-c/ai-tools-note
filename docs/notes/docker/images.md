---
title: 镜像管理
---

# 镜像管理

## 获取镜像

```bash
# 从 Docker Hub 拉取镜像（默认 latest 标签）
docker pull nginx

# 拉取指定标签
docker pull nginx:1.25

# 拉取指定平台的镜像（Apple Silicon 用户可能需要）
docker pull --platform linux/amd64 nginx:1.25
```

::: tip
建议始终指定明确的标签（如 `nginx:1.25`），而非使用 `latest`。`latest` 标签不保证指向最新版本，且每次拉取的结果可能不同。
:::

## 查看镜像

```bash
# 列出本地所有镜像
docker images
# 或
docker image ls

# 只显示镜像 ID
docker images -q

# 按仓库名过滤
docker images nginx

# 使用过滤器
docker images --filter "dangling=true"   # 只显示悬空镜像（无标签）
docker images --filter "since=nginx:1.24" # 显示在此镜像之后构建的
```

## 镜像详情

```bash
# 查看镜像详细信息（JSON 格式）
docker inspect nginx:1.25

# 查看特定字段
docker inspect --format='{{.Architecture}}' nginx:1.25

# 查看镜像构建历史（每一层的命令）
docker history nginx:1.25
```

## 搜索镜像

```bash
# 在 Docker Hub 搜索镜像
docker search nginx

# 只显示官方镜像
docker search --filter is-official=true nginx

# 只显示 star 数大于 50 的
docker search --filter stars=50 nginx

# 限制结果数量
docker search --limit 5 nginx
```

## 删除镜像

```bash
# 删除指定镜像
docker rmi nginx:1.25

# 强制删除（即使有容器在使用）
docker rmi -f nginx:1.25

# 删除所有悬空镜像（<none> 标签）
docker image prune

# 删除所有未使用的镜像
docker image prune -a

# 通过 ID 删除
docker rmi abcd1234efgh
```

::: warning
`docker image prune -a` 会删除所有没有被运行中容器使用的镜像，下次使用时需要重新拉取。
:::

## 镜像标签

```bash
# 为镜像添加标签
docker tag nginx:1.25 my-registry.com/my-nginx:v1

# 添加多个标签（不会创建新镜像，只是新的引用）
docker tag abcd1234efgh my-app:v1.0
docker tag abcd1234efgh my-app:latest
```

## 推送镜像

```bash
# 先登录 Docker Hub
docker login

# 推送镜像
docker push my-username/my-app:v1.0

# 登录私有仓库
docker login my-registry.com
docker push my-registry.com/my-app:v1.0
```

## 导出与导入

适用于离线传输场景：

```bash
# 将镜像保存为 tar 文件
docker save -o my-app.tar my-app:v1.0

# 保存多个镜像到一个文件
docker save -o images.tar nginx:1.25 redis:7 alpine:3.18

# 从 tar 文件加载镜像
docker load -i my-app.tar
```

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `docker pull <镜像>` | 拉取镜像 |
| `docker images` | 列出本地镜像 |
| `docker inspect <镜像>` | 查看镜像详情 |
| `docker history <镜像>` | 查看构建历史 |
| `docker search <关键词>` | 搜索镜像 |
| `docker rmi <镜像>` | 删除镜像 |
| `docker tag <镜像> <新标签>` | 添加标签 |
| `docker push <镜像>` | 推送镜像 |
| `docker save -o file.tar <镜像>` | 导出镜像 |
| `docker load -i file.tar` | 导入镜像 |
| `docker image prune` | 清理悬空镜像 |
