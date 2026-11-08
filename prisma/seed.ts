import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 清空旧数据
  await prisma.taskCompletion.deleteMany();
  await prisma.task.deleteMany();
  await prisma.student.deleteMany();
  await prisma.poem.deleteMany();
  await prisma.mathProblem.deleteMany();

  // 创建示例学生（6年级，小升初阶段）
  const student = await prisma.student.create({
    data: {
      id: "student-001",
      name: "小明",
      grade: 6,
      xp: 340,
      points: 120,
      level: 5,
      streak: 7,
      lastCheckin: new Date(),
    },
  });

  // 今日任务
  const today = new Date();
  today.setHours(23, 59, 59, 0);

  await prisma.task.createMany({
    data: [
      {
        id: "task-001",
        title: "背诵《静夜思》",
        subject: "语文",
        type: "背诵",
        difficulty: "普通",
        xpReward: 15,
        pointReward: 8,
        estimatedMinutes: 15,
        description: "熟练背诵并理解诗意",
        studentId: student.id,
        dueDate: today,
      },
      {
        id: "task-002",
        title: "分数加减法练习",
        subject: "数学",
        type: "练习",
        difficulty: "普通",
        xpReward: 20,
        pointReward: 10,
        estimatedMinutes: 25,
        description: "完成课本第38页第1-10题",
        studentId: student.id,
        dueDate: today,
      },
      {
        id: "task-003",
        title: "英语单词默写",
        subject: "英语",
        type: "打卡",
        difficulty: "普通",
        xpReward: 15,
        pointReward: 8,
        estimatedMinutes: 20,
        description: "Unit 5 核心词汇20个",
        studentId: student.id,
        dueDate: today,
      },
      {
        id: "task-004",
        title: "鸡兔同笼应用题",
        subject: "数学",
        type: "练习",
        difficulty: "挑战",
        xpReward: 30,
        pointReward: 15,
        estimatedMinutes: 30,
        description: "解决综合应用题3道",
        studentId: student.id,
        dueDate: today,
      },
      {
        id: "task-005",
        title: "阅读理解训练",
        subject: "语文",
        type: "练习",
        difficulty: "选做",
        xpReward: 20,
        pointReward: 10,
        estimatedMinutes: 30,
        description: "完成一篇课外阅读理解",
        studentId: student.id,
        dueDate: today,
      },
    ],
  });

  // 必背古诗（小学阶段，按年级）
  await prisma.poem.createMany({
    data: [
      // 1年级
      {
        title: "静夜思",
        author: "李白",
        dynasty: "唐",
        content: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
        grade: 1,
        tags: "思乡,月亮,必背",
      },
      {
        title: "春晓",
        author: "孟浩然",
        dynasty: "唐",
        content: "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
        grade: 1,
        tags: "春天,必背",
      },
      // 2年级
      {
        title: "赠汪伦",
        author: "李白",
        dynasty: "唐",
        content:
          "李白乘舟将欲行，忽闻岸上踏歌声。桃花潭水深千尺，不及汪伦送我情。",
        grade: 2,
        tags: "友情,必背",
      },
      {
        title: "望庐山瀑布",
        author: "李白",
        dynasty: "唐",
        content:
          "日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。",
        grade: 2,
        tags: "山水,必背",
      },
      // 3年级
      {
        title: "绝句",
        author: "杜甫",
        dynasty: "唐",
        content: "两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。",
        grade: 3,
        tags: "写景,必背",
      },
      {
        title: "望天门山",
        author: "李白",
        dynasty: "唐",
        content:
          "天门中断楚江开，碧水东流至此回。两岸青山相对出，孤帆一片日边来。",
        grade: 3,
        tags: "山水,必背",
      },
      // 4年级
      {
        title: "黄鹤楼送孟浩然之广陵",
        author: "李白",
        dynasty: "唐",
        content:
          "故人西辞黄鹤楼，烟花三月下扬州。孤帆远影碧空尽，唯见长江天际流。",
        grade: 4,
        tags: "送别,必背",
      },
      {
        title: "题西林壁",
        author: "苏轼",
        dynasty: "宋",
        content: "横看成岭侧成峰，远近高低各不同。不识庐山真面目，只缘身在此山中。",
        grade: 4,
        tags: "哲理,必背",
      },
      // 5年级
      {
        title: "泊船瓜洲",
        author: "王安石",
        dynasty: "宋",
        content: "京口瓜洲一水间，钟山只隔数重山。春风又绿江南岸，明月何时照我还。",
        grade: 5,
        tags: "思乡,必背",
      },
      {
        title: "秋思",
        author: "张籍",
        dynasty: "唐",
        content:
          "洛阳城里见秋风，欲作家书意万重。复恐匆匆说不尽，行人临发又开封。",
        grade: 5,
        tags: "思乡,必背",
      },
      // 6年级
      {
        title: "马诗",
        author: "李贺",
        dynasty: "唐",
        content: "大漠沙如雪，燕山月似钩。何当金络脑，快走踏清秋。",
        grade: 6,
        tags: "志向,必背",
      },
      {
        title: "石灰吟",
        author: "于谦",
        dynasty: "明",
        content: "千锤万凿出深山，烈火焚烧若等闲。粉骨碎身浑不怕，要留清白在人间。",
        grade: 6,
        tags: "志向,必背",
      },
      {
        title: "竹石",
        author: "郑燮",
        dynasty: "清",
        content: "咬定青山不放松，立根原在破岩中。千磨万击还坚劲，任尔东西南北风。",
        grade: 6,
        tags: "志向,必背",
      },
    ],
  });

  // 数学题库（6年级，小升初常见题型）
  await prisma.mathProblem.createMany({
    data: [
      // 分数计算
      {
        question: "计算：3/4 + 1/6 = ?",
        answer: "11/12",
        options: JSON.stringify(["11/12", "4/10", "5/12", "2/3"]),
        type: "计算",
        topic: "分数",
        grade: 6,
        difficulty: "普通",
      },
      {
        question: "计算：2 又 1/3 × 3/7 = ?",
        answer: "1",
        options: JSON.stringify(["1", "7/9", "6/7", "5/7"]),
        type: "计算",
        topic: "分数",
        grade: 6,
        difficulty: "普通",
      },
      {
        question: "一桶油重 3/5 千克，用去了 1/3，还剩多少千克？",
        answer: "2/5",
        options: JSON.stringify(["2/5", "1/5", "4/15", "2/15"]),
        type: "应用题",
        topic: "分数",
        grade: 6,
        difficulty: "普通",
      },
      // 百分数
      {
        question: "把 0.75 化成百分数是？",
        answer: "75%",
        options: JSON.stringify(["75%", "7.5%", "0.75%", "750%"]),
        type: "计算",
        topic: "百分数",
        grade: 6,
        difficulty: "普通",
      },
      {
        question: "班级有40人，女生24人，女生占全班的百分之几？",
        answer: "60%",
        options: JSON.stringify(["60%", "40%", "55%", "65%"]),
        type: "应用题",
        topic: "百分数",
        grade: 6,
        difficulty: "普通",
      },
      // 几何
      {
        question: "圆的直径是10厘米，它的面积是多少平方厘米？（π取3.14）",
        answer: "78.5",
        options: JSON.stringify(["78.5", "31.4", "314", "62.8"]),
        type: "计算",
        topic: "几何",
        grade: 6,
        difficulty: "普通",
      },
      {
        question: "一个长方体，长6cm，宽4cm，高3cm，体积是多少立方厘米？",
        answer: "72",
        options: JSON.stringify(["72", "36", "48", "108"]),
        type: "计算",
        topic: "几何",
        grade: 6,
        difficulty: "普通",
      },
      // 鸡兔同笼（挑战）
      {
        question: "鸡兔同笼，共有头35个，脚94只，兔有多少只？",
        answer: "12",
        options: JSON.stringify(["12", "23", "15", "20"]),
        type: "应用题",
        topic: "方程",
        grade: 6,
        difficulty: "挑战",
      },
      {
        question: "小明比小红大3岁，两人年龄之和为25岁，小红多少岁？",
        answer: "11",
        options: JSON.stringify(["11", "14", "13", "12"]),
        type: "应用题",
        topic: "方程",
        grade: 6,
        difficulty: "挑战",
      },
      // 比例
      {
        question: "一辆汽车3小时行180千米，照这样的速度，5小时行多少千米？",
        answer: "300",
        options: JSON.stringify(["300", "270", "360", "240"]),
        type: "应用题",
        topic: "比例",
        grade: 6,
        difficulty: "普通",
      },
    ],
  });

  console.log("✅ 种子数据写入完成");
  console.log(`   学生：${student.name}（${student.grade}年级）`);
  console.log(`   任务：5条`);
  console.log(`   古诗：13首（1-6年级）`);
  console.log(`   数学题：10道`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
