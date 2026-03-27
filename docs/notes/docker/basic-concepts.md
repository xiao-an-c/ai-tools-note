---
title: Docker 核心概念
description: 理解镜像、容器、仓库三大基础概念
---

# 核心概念

## 镜像 (Image)

镜像是创建 Docker 容器的只读模板。它包含运行应用所需的一切：代码、运行时、库、环境变量和配置文件。

**类比**：如果把容器比作面向对象中的"对象"，那镜像就是"类"。

关键特性：

- **分层存储**：镜像由多个只读层组成，每层代表一个文件系统变更
- **不可变**：镜像构建后不能修改，只能通过创建新层来覆盖
- **可复用**：一个镜像可以创建无数个容器实例

```bash
# 拉取一个镜像
docker pull nginx:latest

# 查看本地镜像
docker images
```

## 容器 (Container)

容器是镜像的运行实例。它在镜像的基础上添加了一个可写层，所有运行时的修改都写在这个层中。

**类比**：镜像是"程序"，容器是"进程"。

关键特性：

- **隔离性**：每个容器有独立的文件系统、网络和进程空间
- **轻量级**：共享宿主机内核，不需要额外的操作系统开销
- **临时性**：容器删除后，其可写层的数据会丢失（除非使用 Volume）

```bash
# 从镜像创建并启动容器
docker run -d --name my-nginx nginx:latest

# 查看运行中的容器
docker ps
```

## 仓库 (Registry)

仓库用于存储和分发 Docker 镜像。

- **Docker Hub**：最大的公共镜像仓库，类似 GitHub
- **私有仓库**：企业内部搭建，如 Harbor、AWS ECR
- **镜像标签 (Tag)**：用于区分同一镜像的不同版本，如 `nginx:1.25`、`nginx:latest`

```bash
# 从 Docker Hub 拉取镜像
docker pull python:3.12

# 推送镜像到仓库
docker push my-registry.com/my-app:v1.0
```

## 镜像与容器的关系

```
┌─────────────────────────────┐
│         容器 (Container)     │
│  ┌───────────────────────┐  │
│  │   可写层 (Writable)    │  │  ← 运行时修改
│  ├───────────────────────┤  │
│  │   Layer 3: CMD 配置   │  │
│  ├───────────────────────┤  │
│  │   Layer 2: 依赖安装   │  │  ← 镜像层（只读）
│  ├───────────────────────┤  │
│  │   Layer 1: 基础系统   │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

- **同一镜像**的多个容器共享只读层，节省磁盘空间
- 每个容器有独立的可写层，互不影响

## Docker 架构

Docker 采用 Client-Server 架构：

```
┌──────────────┐     REST API     ┌──────────────────┐
│  Docker CLI  │ ───────────────→ │  Docker Daemon   │
│  (客户端)     │                  │  (dockerd)       │
└──────────────┘                  ├──────────────────┤
                                  │  Containers      │
┌──────────────┐                  │  Images          │
│  Docker      │ ───────────────→ │  Networks        │
│  Compose     │                  │  Volumes         │
└──────────────┘                  └──────────────────┘
                                          │
                                          ▼
                                  ┌──────────────────┐
                                  │  Docker Hub /    │
                                  │  Private Registry│
                                  └──────────────────┘
```

- **Docker Client**：用户通过 CLI 与 Docker 交互
- **Docker Daemon**：后台服务，负责构建、运行、管理容器
- **Registry**：存储和分发镜像

## 容器生命周期

容器从创建到销毁经历以下状态：

```
  docker create       docker start        docker stop
 ──────────────→  ──────────────→  ──────────────→
│   Created    │   │   Running    │   │   Stopped    │
 ──────────────   ──────────────   ──────────────
                                       ↑       ↓
                                  docker start  docker stop

 任何状态 ──────────→  docker rm  ──────────→  Deleted（已删除）
```

| 状态 | 说明 | 触发命令 |
|------|------|---------|
| Created | 已创建但未启动 | `docker create` |
| Running | 正在运行 | `docker start` / `docker run` |
| Paused | 已暂停 | `docker pause` |
| Stopped | 已停止 | `docker stop` |
| Deleted | 已删除 | `docker rm` |

::: tip
`docker run` 相当于 `docker create` + `docker start` 的组合。
:::
