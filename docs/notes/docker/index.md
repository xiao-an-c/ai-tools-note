---
title: Docker 学习笔记
description: 从零开始的 Docker 容器化入门到实战
---

# Docker 学习笔记

> Docker - 轻量级容器化平台，让应用的构建、分发和运行变得简单一致

## Docker 是什么

Docker 是一个开源的容器化平台，它将应用及其所有依赖打包到一个标准化的容器中，确保应用在任何环境中都能一致运行。

### 解决什么问题

"在我机器上能跑" -- 这是开发运维协作中最常见的问题。Docker 通过容器化彻底解决了这个问题：

- **环境一致性**：开发、测试、生产环境完全相同
- **快速部署**：秒级启动，无需安装配置运行环境
- **资源隔离**：每个容器独立运行，互不干扰
- **版本管理**：镜像像代码一样可以版本化和回滚

### Docker vs 虚拟机

| 特性 | Docker 容器 | 虚拟机 |
|------|-----------|--------|
| 启动速度 | 秒级 | 分钟级 |
| 资源占用 | MB 级 | GB 级 |
| 隔离级别 | 进程级 | 操作系统级 |
| 镜像大小 | 通常 MB ~ 数百 MB | 通常 GB 级 |
| 性能 | 接近原生 | 有虚拟化开销 |
| 系统支持 | 共享宿主内核 | 独立操作系统 |

## 核心概念

| 概念 | 说明 |
|------|------|
| 镜像 (Image) | 应用的只读模板，包含代码、运行时、依赖 |
| 容器 (Container) | 镜像的运行实例，独立隔离的进程 |
| Dockerfile | 构建镜像的指令文件 |
| Docker Compose | 定义和管理多容器应用的工具 |
| Volume | 数据持久化存储 |
| Network | 容器间通信网络 |
| Registry | 镜像仓库（如 Docker Hub） |

## 官方资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Docker GitHub](https://github.com/docker)
- [Play with Docker](https://labs.play-with-docker.com/) - 在线练习环境

## 学习路径

### 入门

1. [安装与配置](./installation) - 在你的机器上安装 Docker
2. [核心概念](./basic-concepts) - 理解镜像、容器、仓库

### 使用

3. [镜像管理](./images) - 搜索、下载、构建、分享镜像
4. [容器操作](./containers) - 创建、运行、管理容器

### 深入

5. [Dockerfile 详解](./dockerfile) - 编写 Dockerfile 构建自定义镜像
6. [数据持久化](./volumes) - Volume 和 Bind Mount
7. [Docker 网络](./networking) - 容器间通信和网络管理

### 实战

8. [Docker Compose](./compose) - 定义和运行多容器应用
9. [多阶段构建](./multi-stage) - 优化镜像体积
10. [Docker 与 CI/CD](./cicd) - 在持续集成中使用 Docker

### 进阶

11. [最佳实践](./best-practices) - 生产环境使用建议
12. [常见问题与排查](./troubleshooting) - 问题诊断和解决
