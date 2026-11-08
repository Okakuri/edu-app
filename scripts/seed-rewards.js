/**
 * 写入默认奖励数据
 * 换电脑后运行: node scripts/seed-rewards.js
 */
const { PrismaClient } = require("@prisma/client");

process.env.DATABASE_URL = "file:./prisma/dev.db";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.reward.count();
  if (count > 0) {
    console.log(`ℹ️  已有 ${count} 个奖励，跳过`);
    return;
  }

  await prisma.reward.createMany({
    data: [
      { title: "出去游乐场玩", description: "周末去附近游乐场玩半天", emoji: "🎠", cost: 80,  stock: -1, studentId: "student-001" },
      { title: "买一本新书",   description: "可以自己选一本喜欢的书", emoji: "📚", cost: 60,  stock: -1, studentId: "student-001" },
      { title: "打一小时游戏", description: "可以玩平板或电脑游戏1小时", emoji: "🎮", cost: 50,  stock: -1, studentId: "student-001" },
      { title: "看一场电影",   description: "去电影院或在家看一部电影", emoji: "🎬", cost: 100, stock: -1, studentId: "student-001" },
      { title: "点一次外卖",   description: "可以自己选想吃的外卖",    emoji: "🍕", cost: 70,  stock: -1, studentId: "student-001" },
      { title: "免做一次作业", description: "可以免除一次课外作业",    emoji: "🏆", cost: 150, stock: 3,  studentId: "student-001" },
    ],
  });
  console.log("✅ 默认奖励写入完成（6个）");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
