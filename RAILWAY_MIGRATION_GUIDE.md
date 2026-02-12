# 🚂 Railway 迁移指南

完整的步骤指南,帮助您将个人日记网站从 Render 迁移到 Railway,解决数据丢失问题。

---

## 📋 迁移前准备

### 1. 备份现有数据(如果有)

如果您在 Render 上已经有一些日记数据,虽然可能随时丢失,但建议先尝试备份:

**方法**: 登录网站后,手动复制所有日记内容到本地文本文件。

⚠️ **注意**: 由于 Render 的临时文件系统,数据库文件无法直接下载。

---

## 🚀 Railway 部署步骤

### 步骤 1: 提交配置文件到 GitHub

我已经为您准备好了 Railway 配置文件,需要提交到您的 GitHub 仓库。

**执行以下命令**:

```bash
cd /path/to/personal-journal  # 进入项目目录

# 添加新文件
git add railway.json .railwayignore

# 提交
git commit -m "Add Railway configuration for deployment"

# 推送到 GitHub
git push origin main
```

**新增文件说明**:
- `railway.json` - Railway 部署配置
- `.railwayignore` - 部署时忽略的文件

---

### 步骤 2: 注册 Railway 账号

1. 访问 [Railway.app](https://railway.app/)
2. 点击 **"Start a New Project"**
3. 使用 **GitHub 账号登录**(推荐)
4. 授权 Railway 访问您的 GitHub 仓库

✅ **免费额度**: 每月 $5 免费额度,足够个人使用

---

### 步骤 3: 创建新项目

1. 登录后,点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 找到并选择 **`yibeimeng-wq/personal-journal`** 仓库
4. Railway 会自动检测到 Node.js 项目并开始部署

⏱️ **部署时间**: 约 2-3 分钟

---

### 步骤 4: 配置环境变量

部署完成后,需要设置环境变量:

1. 在项目页面,点击您的服务
2. 切换到 **"Variables"** 标签
3. 添加以下环境变量:

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PORT` | `3000` | 服务端口(可选,Railway 会自动设置) |
| `JWT_SECRET` | `your-secret-key-here` | JWT 密钥,请设置一个随机字符串 |
| `NODE_ENV` | `production` | 生产环境标识 |

**生成 JWT_SECRET**:
```bash
# 在终端运行,生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. 点击 **"Add"** 保存

---

### 步骤 5: 添加持久化存储(Volume)

这是**最关键的一步**,确保数据不会丢失!

1. 在服务页面,点击 **"Settings"** 标签
2. 找到 **"Volumes"** 部分
3. 点击 **"+ New Volume"**
4. 配置 Volume:
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB(免费)
5. 点击 **"Add"** 创建

⚠️ **重要**: 这会让 `/app/data` 目录持久化,数据库文件不会丢失!

---

### 步骤 6: 更新数据库路径(可选)

如果您想明确指定数据库路径,可以添加环境变量:

| 变量名 | 值 |
|--------|-----|
| `DB_PATH` | `/app/data/journal.db` |

**说明**: 代码中默认使用 `./data/journal.db`,在 Railway 上会自动映射到 `/app/data/journal.db`

---

### 步骤 7: 重新部署

添加 Volume 后,需要重新部署:

1. 在项目页面,点击 **"Deployments"** 标签
2. 点击最新部署右侧的 **"⋮"** 菜单
3. 选择 **"Redeploy"**

或者直接推送一个新的 commit 到 GitHub,Railway 会自动重新部署。

---

### 步骤 8: 获取部署 URL

1. 部署完成后,在服务页面找到 **"Settings"** 标签
2. 找到 **"Domains"** 部分
3. 点击 **"Generate Domain"**
4. Railway 会生成一个公开 URL,例如: `https://your-app.up.railway.app`

🎉 **完成!** 您的网站现在运行在 Railway 上了!

---

## ✅ 验证部署

### 1. 访问新网站

打开 Railway 生成的 URL,例如: `https://your-app.up.railway.app`

### 2. 创建账号和日记

1. 注册一个新账号
2. 创建几条测试日记
3. 记录日记内容

### 3. 测试数据持久化

**方法 1: 刷新浏览器**
- 刷新页面
- 重新登录
- ✅ 确认日记仍然存在

**方法 2: 重启服务**
- 在 Railway 项目页面,点击服务
- 点击 **"Settings"** → **"Restart"**
- 等待重启完成
- 重新登录
- ✅ 确认日记仍然存在

**方法 3: 等待 24 小时**
- 第二天再次访问
- ✅ 确认数据没有丢失

---

## 🔄 从 Render 迁移数据(可选)

由于 Render 使用临时文件系统,无法直接导出数据库。如果您有重要数据,需要手动迁移:

### 方法: 手动重新创建

1. 在 Render 网站上,登录并查看所有日记
2. 复制每条日记的标题和内容
3. 在 Railway 新网站上重新创建

**建议**: 使用浏览器的开发者工具,通过 API 批量导出数据(需要技术能力)。

---

## 🗑️ 关闭 Render 服务

确认 Railway 部署成功且数据正常后:

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 找到您的 `personal-journal` 服务
3. 点击 **"Settings"**
4. 滚动到底部,点击 **"Delete Service"**
5. 确认删除

⚠️ **注意**: 删除后,Render 上的所有数据将永久丢失(但由于是临时文件系统,数据本来就会丢失)。

---

## 📊 Railway vs Render 对比

| 特性 | Railway | Render |
|------|---------|--------|
| 文件持久化 | ✅ 支持 Volume | ❌ 临时文件系统 |
| 免费额度 | $5/月 | 750 小时/月 |
| 部署速度 | ⚡ 快 | 🐢 较慢 |
| 数据库支持 | ✅ 内置 PostgreSQL | ✅ 内置 PostgreSQL |
| 自定义域名 | ✅ 免费 | ✅ 免费 |
| 自动休眠 | ❌ 不休眠 | ✅ 15 分钟无活动 |

---

## 🎯 成本估算

### Railway 免费额度

- **每月**: $5 免费额度
- **包含**: 
  - 500 小时运行时间(约 20 天 24/7 运行)
  - 100 GB 出站流量
  - 1 GB Volume 存储

### 个人日记网站预估

- **运行时间**: 24/7 = 720 小时/月
- **超出免费额度**: 220 小时
- **额外费用**: 约 $2-3/月

**总成本**: 约 $2-3/月(或使用免费额度 + 部分付费)

💡 **省钱技巧**: 如果不需要 24/7 运行,可以设置自动休眠,完全免费!

---

## 🐛 常见问题

### Q1: 部署失败,提示 "Build failed"

**解决方法**:
1. 检查 `package.json` 中的 `start` 脚本是否正确
2. 确保 `node_modules` 没有提交到 Git
3. 查看 Railway 的构建日志,找到具体错误

### Q2: 网站无法访问,显示 "Application failed to respond"

**解决方法**:
1. 检查 `PORT` 环境变量是否设置
2. 确保代码中使用 `process.env.PORT`
3. 查看 Railway 的运行日志

### Q3: Volume 没有生效,数据仍然丢失

**解决方法**:
1. 确认 Volume 挂载路径为 `/app/data`
2. 检查代码中 `DB_PATH` 是否指向 `/app/data/journal.db`
3. 重新部署服务

### Q4: 超出免费额度怎么办?

**解决方法**:
1. 添加信用卡,按使用量付费(约 $2-3/月)
2. 或者设置服务自动休眠,减少运行时间
3. 或者迁移到其他平台(Fly.io, VPS 等)

---

## 📚 后续优化建议

### 1. 设置自定义域名

1. 在 Railway 项目页面,点击 **"Settings"** → **"Domains"**
2. 点击 **"Custom Domain"**
3. 输入您的域名,例如: `journal.yourdomain.com`
4. 在域名 DNS 设置中添加 CNAME 记录

### 2. 启用 HTTPS

Railway 自动为所有域名提供免费 SSL 证书,无需配置!

### 3. 设置备份

定期备份数据库文件:

```bash
# 在 Railway 服务中添加定时任务
# 每天备份数据库到 S3 或其他云存储
```

### 4. 监控和告警

使用 Railway 的内置监控功能:
- CPU 使用率
- 内存使用率
- 请求数量
- 错误日志

---

## 🎉 迁移完成!

恭喜!您已经成功将个人日记网站迁移到 Railway,数据持久化问题已解决!

**下一步**:
1. ✅ 测试所有功能是否正常
2. ✅ 修复之前发现的 3 个前端 BUG
3. ✅ 享受稳定可靠的日记服务!

如有任何问题,欢迎随时询问!
