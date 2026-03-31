# macOS 网络基础

## 搭建网关时涉及的几个概念

### loopback 地址

`127.0.0.1` 是 loopback 地址，意思是"本机自己"。访问这个地址的数据不会离开你的电脑，直接在本机内部转发。

```
127.0.0.1  =  localhost  =  你自己的电脑
192.168.x.x =  局域网里的其他设备
```

### loopback alias（虚拟 IP）

一台电脑可以有多个 IP 地址。`ifconfig lo0 alias 10.0.0.1` 给本机网卡添加了一个额外的 IP：

```
lo0（loopback 网卡）:
  127.0.0.1    ← 默认就有
  10.0.0.1     ← 我们手动添加的
```

两个地址都指向本机，但它们是不同的地址。这在我们的方案中很关键，因为 macOS 的 `/etc/resolver/` 机制要求 dnsmasq 绑定在非 `127.0.0.1` 的地址上。

### 端口

一台电脑上同时跑很多服务，操作系统通过"端口号"来区分它们：

```
127.0.0.1:80   → Nginx Proxy Manager（HTTP）
127.0.0.1:81   → NPM 管理界面
127.0.0.1:1010 → 股票系统
127.0.0.1:1001 → NewAPI
```

端口号范围是 0-65535：
- **0-1023**：系统保留端口，需要 root 权限
- **1024-49151**：注册端口，常见服务使用
- **49152-65535**：动态端口，临时使用

DNS 服务默认用 **53 端口**，HTTP 默认用 **80 端口**。

### LaunchDaemon（开机自启）

macOS 用 launchd 管理后台服务，类似于 Linux 的 systemd。配置文件是 plist 格式，放在 `/Library/LaunchDaemons/` 目录下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "...">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.local.loopback-alias</string>   <!-- 唯一标识 -->
    <key>ProgramArguments</key>
    <array>
        <string>ifconfig</string>
        <string>lo0</string>
        <string>alias</string>
        <string>10.0.0.1</string>              <!-- 要执行的命令 -->
    </array>
    <key>RunAtLoad</key>
    <true/>                                    <!-- 开机时执行 -->
</dict>
</plist>
```

关键标签：
- `Label`：服务的唯一标识
- `ProgramArguments`：要执行的命令及参数
- `RunAtLoad`：是否在加载时自动运行

### brew services

Homebrew 也提供了服务管理功能，底层也是 launchd：

```bash
brew services start dnsmasq   # 启动并注册开机自启
brew services stop dnsmasq    # 停止
brew services list            # 查看所有 brew 管理的服务
```

brew 会自动在 `~/Library/LaunchAgents/` 创建 plist 文件。

### Docker 端口映射

Docker 容器有自己独立的网络，容器内的端口和宿主机（你的 Mac）是隔离的。端口映射让宿主机可以访问容器内的服务：

```yaml
ports:
  - "80:80"    # 宿主机80端口 → 容器80端口
  - "81:81"    # 宿主机81端口 → 容器81端口
```

```
Mac（宿主机）
  127.0.0.1:80  ──映射──→  容器内:80（NPM 的 HTTP）
  127.0.0.1:81  ──映射──→  容器内:81（NPM 管理界面）
```

### 为什么 Docker 里的 dnsmasq 不行

在搭建过程中，我们尝试过把 dnsmasq 放在 Docker 容器里运行，但失败了。原因是：

1. Mac 版 Docker Desktop 运行在一个 Linux 虚拟机中
2. 容器内的网络通过虚拟机转发到 Mac
3. 端口映射在跨架构（amd64 容器跑在 arm64 Mac 上）时不稳定
4. DNS 对延迟和连接稳定性要求很高

所以最终选择了用 brew 直接在 Mac 本机安装 dnsmasq。

## 下一篇

→ [完整搭建指南](/notes/local-gateway/01-搭建指南)
