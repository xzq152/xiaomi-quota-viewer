# 小米模型额度查看器

一个 VS Code 插件，在状态栏实时显示小米模型 API 的额度使用情况。

## 功能特性

- 📊 状态栏实时显示本月额度使用百分比
- 🔔 智能提醒：额度使用超过 50% 显示提示，超过 80% 显示警告
- 🔄 自动刷新（默认 60 秒，可配置）
- 📋 悬浮查看详情（本月/总计使用量和额度）
- 🔐 Cookie 认证，安全便捷

## 安装方式

### 方式一：从 VSIX 安装

1. 下载 `xiaomi-quota-viewer-1.0.1.vsix`
2. 打开 VS Code
3. 按 `Ctrl+Shift+P`，输入 `Extensions: Install from VSIX...`
4. 选择下载的 `.vsix` 文件

### 方式二：从源码构建

```bash
# 克隆仓库
git clone git@github.com:xzq152/xiaomi-quota-viewer.git

# 进入目录
cd xiaomi-quota-viewer

# 安装依赖
npm install

# 编译
npm run compile

# 打包
npm run package
```

## 使用方法

### 1. 获取 Cookie

1. 打开浏览器，访问 [小米平台](https://platform.xiaomimimo.com/console/plan-manage)
2. 按 `F12` 打开开发者工具
3. 切换到 `Network`（网络）标签
4. 刷新页面，点击任意请求
5. 在 `Headers` 中找到 `Cookie` 字段，复制完整内容

### 2. 配置 Cookie

- 按 `Ctrl+Shift+P`，输入 `小米额度: 设置 Cookie`
- 粘贴刚才复制的 Cookie 字符串

### 3. 查看额度

配置完成后，状态栏左下角会自动显示额度使用情况：

| 图标 | 含义 |
|------|------|
| 📊 | 额度使用 < 50% |
| ℹ️ | 额度使用 50% - 80% |
| ⚠️ | 额度使用 > 80% |

- **点击**：刷新额度
- **悬浮**：查看详细信息

## 配置项

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `xiaomiQuota.cookie` | `""` | 小米平台 Cookie |
| `xiaomiQuota.refreshInterval` | `60` | 自动刷新间隔（秒），设为 `0` 禁用自动刷新 |

在 VS Code 设置中搜索 `小米模型额度` 可找到配置项。

## 命令列表

| 命令 | 说明 |
|------|------|
| `小米额度: 设置 Cookie` | 配置小米平台 Cookie |
| `小米额度: 刷新额度` | 手动刷新额度数据 |

## 许可证

MIT
