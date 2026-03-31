# DNS 是什么

## 一句话解释

DNS（Domain Name System）就是互联网的"电话簿"——你输入 `google.com`，DNS 帮你查出它对应的 IP 地址 `142.250.80.46`。

## 为什么需要 DNS

计算机之间通信靠的是 **IP 地址**（如 `192.168.1.1`），但人类记不住这些数字，所以有了域名系统：

```
你输入:  stock.d.me
   ↓ DNS 查询
返回:    127.0.0.1
   ↓ 浏览器连接
访问到:  本机的某个服务
```

## DNS 查询过程

当你访问 `stock.d.me` 时，发生了这些事：

```
浏览器
  ↓ "stock.d.me 的 IP 是多少？"
操作系统 DNS 解析器
  ↓ 查 /etc/resolver/ → 找到 dnsmasq
  ↓ 或查 /etc/hosts → 找到记录
  ↓ 或查系统默认 DNS（如 114.114.114.114）
DNS 服务器
  ↓ 返回 127.0.0.1
浏览器
  ↓ 连接 127.0.0.1:80
Nginx Proxy Manager
  ↓ 转发到 localhost:1010
你的服务
```

## DNS 记录类型

最常见的几种：

| 类型 | 作用 | 示例 |
|------|------|------|
| A | 域名 → IPv4 地址 | `stock.d.me → 127.0.0.1` |
| AAAA | 域名 → IPv6 地址 | `stock.d.me → ::1` |
| CNAME | 域名 → 另一个域名 | `www.d.me → d.me` |
| MX | 邮件服务器 | `d.me → mail.d.me` |

本地网关只用到 **A 记录**。

## macOS 的 DNS 解析顺序

macOS 查域名时，按这个顺序：

1. **`/etc/hosts`** — 手动配置的静态映射，优先级最高
2. **`/etc/resolver/`** — 按域名指定的 DNS 服务器（我们的方案用了这个）
3. **系统默认 DNS** — 网络设置里配的 DNS 服务器（如 114.114.114.114）

```
stock.d.me
  ↓ 先查 /etc/hosts → 没有
  ↓ 再查 /etc/resolver/d.me → 找到了！nameserver 10.0.0.1
  ↓ 询问 10.0.0.1（dnsmasq）
  ↓ dnsmasq 配置了 address=/d.me/127.0.0.1
  ↓ 返回 127.0.0.1
```

## /etc/hosts

最简单的域名配置方式，一行一条：

```
127.0.0.1   localhost
127.0.0.1   stock.d.me
127.0.0.1   newapi.d.me
```

**缺点**：不支持通配符。加了 `stock.d.me` 只匹配它自己，`other.d.me` 还需要另加一行。

## /etc/resolver/

macOS 特有的机制，可以为特定域名指定 DNS 服务器：

```bash
# 创建 /etc/resolver/d.me 文件
# 内容：nameserver 10.0.0.1
```

效果：所有 `*.d.me` 的查询都发给 `10.0.0.1`（我们的 dnsmasq），其他域名照常走系统 DNS。

**这就是我们能实现通配符域名的原因**：dnsmasq 支持 `address=/d.me/127.0.0.1` 这种通配配置，而 `/etc/resolver/` 让 macOS 把 `*.d.me` 的查询都转给 dnsmasq。

## dnsmasq

一个轻量级 DNS 转发/解析服务。核心功能：

- **自定义域名解析**：`address=/d.me/127.0.0.1` — 所有 `*.d.me` 解析到 127.0.0.1
- **DNS 转发**：不认识的域名转发给上游 DNS（如 114.114.114.114）
- **极轻量**：内存占用不到 1MB

在我们的方案中，dnsmasq 只做第一件事——把 `*.d.me` 解析到本机。

## 验证 DNS

```bash
# dig 直连外部 DNS，不走 macOS resolver（不推荐用来验证本地方案）
dig stock.d.me +short

# dscacheutil 走 macOS 完整解析链路（推荐）
dscacheutil -q host -a name stock.d.me
# 输出: name: stock.d.me  ip_address: 127.0.0.1
```

## 下一篇

→ [反向代理是什么](/notes/local-gateway/02-反向代理)
