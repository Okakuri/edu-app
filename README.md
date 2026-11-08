# 星际学霸 · 小升初学习工作台

一个面向小升初阶段的儿童学习管理应用，太空冒险主题，游戏化奖励机制。

## 功能

- 🚀 **工作台** — 今日学习任务、XP 经验条、连续打卡
- ✨ **知识练习** — 古诗词浏览/填空测试、数学选择题、英语单词翻转卡
- 🎁 **星钻商店** — 用积分兑换现实奖励（家长审批制）
- ⭐ **成长记录** — 等级系统、7天打卡柱状图、成就徽章
- 🌙 **家长中心** — 任务管理、奖励设置、兑换审批

## 技术栈

- **前端/后端**: Next.js 14 (App Router) + TypeScript
- **样式**: Tailwind CSS v4，深空主题 + 玻璃拟态
- **数据库**: SQLite + Prisma 5
- **运行环境**: Node.js 18+

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 创建 .env 文件
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env

# 3. 初始化数据库 + 写入种子数据
npx prisma migrate dev --name init

# 4. 写入默认奖励数据
node scripts/seed-rewards.js

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 知识库

- 📜 古诗词：31首（小学1-6年级必背）
- 🔢 数学题：24道（6年级，含分数/百分数/几何/方程/比例）
- 🌍 英语词汇：3组共20个核心单词

## 项目结构

```
app/
  page.tsx              # 工作台
  practice/             # 知识练习
  shop/                 # 星钻商店
  profile/              # 成长记录
  parent/               # 家长中心
  api/                  # API 路由
    tasks/
    rewards/
    practice/
    student/
    stats/
components/
  BottomNav.tsx
lib/
  prisma.ts
  utils.ts
prisma/
  schema.prisma
  seed.ts               # 初始数据
scripts/
  add-content.ts        # 扩充知识库
```
