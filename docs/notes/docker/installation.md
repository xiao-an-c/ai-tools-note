---
title: Docker 安装与配置
---

# 安装与配置

## 系统要求

| 平台 | 最低要求 |
|------|---------|
| macOS | macOS 12 (Monterey) 或更高，Apple Silicon 或 Intel |
| Windows | Windows 10 64-bit，需启用 WSL2 |
| Linux | 64-bit 内核 3.10+（推荐 Ubuntu 20.04+） |

## macOS 安装

### 方式一：Docker Desktop（推荐）

从 [Docker 官网](https://docs.docker.com/desktop/install/mac-install/) 下载 DMG 安装包，双击拖入 Applications。

### 方式二：Homebrew

```bash
brew install --cask docker
```

安装后启动 Docker Desktop 应用，等待状态栏图标显示为稳定状态。

## Windows 安装

### 前置条件

1. 启用 WSL2：

```powershell
wsl --install
```

2. 重启电脑后，确保 WSL2 为默认版本：

```powershell
wsl --set-default-version 2
```

### 安装 Docker Desktop

从 [Docker 官网](https://docs.docker.com/desktop/install/windows-install/) 下载安装包，安装时勾选 "Use WSL 2 instead of Hyper-V"。

::: tip
Windows 用户建议使用 WSL2 后端而非 Hyper-V，性能更好。安装完成后在 Docker Desktop 的 Settings → General 中确认 "Use the WSL 2 based engine" 已启用。
:::

## Linux 安装（Ubuntu/Debian）

### 卸载旧版本

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

### 安装步骤

```bash
# 1. 更新包索引并安装依赖
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg

# 2. 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. 添加仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. 安装 Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 验证安装

```bash
# 查看 Docker 版本
docker --version

# 运行测试容器
docker run hello-world

# 查看 Docker 系统信息
docker info
```

如果 `docker run hello-world` 输出 "Hello from Docker!"，说明安装成功。

## 非 root 用户配置（Linux）

默认情况下 Docker 需要 sudo 权限。将当前用户加入 docker 组可免去 sudo：

```bash
sudo usermod -aG docker $USER
```

::: warning
添加用户组后需要**重新登录**或运行 `newgrp docker` 才能生效。
:::

## 镜像加速配置

国内用户可配置镜像加速，提升拉取速度。

### Docker Desktop（macOS/Windows）

Settings → Docker Engine，在 JSON 配置中添加：

```json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
```

点击 "Apply & Restart"。

### Linux

创建或编辑 `/etc/docker/daemon.json`：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

::: tip
镜像加速地址可能会变更，如果拉取失败可以搜索最新的可用加速地址。
:::

## 卸载 Docker

### macOS

```bash
# 通过 Homebrew 安装的
brew uninstall --cask docker

# 或直接从 Applications 中删除 Docker.app
```

### Ubuntu/Debian

```bash
sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```
