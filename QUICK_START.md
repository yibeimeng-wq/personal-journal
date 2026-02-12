# 🚀 Railway 迁移快速开始

## 第一步: 提交配置文件到 GitHub

```bash
cd /path/to/personal-journal

git add railway.json .railwayignore
git commit -m "Add Railway configuration"
git push origin main
```

## 第二步: 部署到 Railway

1. 访问 https://railway.app/
2. 使用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择 `yibeimeng-wq/personal-journal`
5. 等待部署完成(2-3 分钟)

## 第三步: 添加 Volume(关键!)

1. 点击服务 → Settings → Volumes
2. 点击 "+ New Volume"
3. Mount Path: `/app/data`
4. Size: 1 GB
5. 点击 "Add"
6. 重新部署(Deployments → Redeploy)

## 第四步: 设置环境变量

1. 点击服务 → Variables
2. 添加:
   - `JWT_SECRET`: (生成随机字符串)
   - `NODE_ENV`: `production`

## 第五步: 获取 URL

1. Settings → Domains → Generate Domain
2. 复制 URL,例如: `https://your-app.up.railway.app`

## ✅ 完成!

访问新 URL,创建账号,测试功能!

详细步骤请查看: `RAILWAY_MIGRATION_GUIDE.md`
