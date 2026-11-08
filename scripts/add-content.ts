/**
 * 扩充知识库内容脚本
 * 运行: ts-node --compiler-options {"module":"CommonJS"} scripts/add-content.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXTRA_POEMS = [
  // 1年级
  { title: "咏鹅", author: "骆宾王", dynasty: "唐", content: "鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。", grade: 1, tags: "写景,动物,必背" },
  { title: "画", author: "王维", dynasty: "唐", content: "远看山有色，近听水无声。春去花还在，人来鸟不惊。", grade: 1, tags: "哲理,必背" },
  { title: "悯农（其一）", author: "李绅", dynasty: "唐", content: "春种一粒粟，秋收万颗子。四海无闲田，农夫犹饿死。", grade: 1, tags: "劳动,必背" },
  // 2年级
  { title: "登鹳雀楼", author: "王之涣", dynasty: "唐", content: "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。", grade: 2, tags: "哲理,必背" },
  { title: "春雨", author: "杜甫", dynasty: "唐", content: "好雨知时节，当春乃发生。随风潜入夜，润物细无声。", grade: 2, tags: "春天,必背" },
  { title: "梅花", author: "王安石", dynasty: "宋", content: "墙角数枝梅，凌寒独自开。遥知不是雪，为有暗香来。", grade: 2, tags: "品格,必背" },
  // 3年级
  { title: "九月九日忆山东兄弟", author: "王维", dynasty: "唐", content: "独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。", grade: 3, tags: "思乡,必背" },
  { title: "山行", author: "杜牧", dynasty: "唐", content: "远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。", grade: 3, tags: "秋天,写景,必背" },
  { title: "夜书所见", author: "叶绍翁", dynasty: "宋", content: "萧萧梧叶送寒声，江上秋风动客情。知有儿童挑促织，夜深篱落一灯明。", grade: 3, tags: "思乡,必背" },
  // 4年级
  { title: "望洞庭", author: "刘禹锡", dynasty: "唐", content: "湖光秋月两相和，潭面无风镜未磨。遥望洞庭山水翠，白银盘里一青螺。", grade: 4, tags: "写景,必背" },
  { title: "独坐敬亭山", author: "李白", dynasty: "唐", content: "众鸟高飞尽，孤云独去闲。相看两不厌，只有敬亭山。", grade: 4, tags: "情感,必背" },
  { title: "早发白帝城", author: "李白", dynasty: "唐", content: "朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。", grade: 4, tags: "山水,必背" },
  // 5年级
  { title: "长相思", author: "纳兰性德", dynasty: "清", content: "山一程，水一程，身向榆关那畔行，夜深千帐灯。风一更，雪一更，聒碎乡心梦不成，故园无此声。", grade: 5, tags: "思乡,必背" },
  { title: "枫桥夜泊", author: "张继", dynasty: "唐", content: "月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。", grade: 5, tags: "思乡,必背" },
  { title: "示儿", author: "陆游", dynasty: "宋", content: "死去元知万事空，但悲不见九州同。王师北定中原日，家祭无忘告乃翁。", grade: 5, tags: "爱国,必背" },
  // 6年级
  { title: "七步诗", author: "曹植", dynasty: "三国", content: "煮豆燃豆萁，豆在釜中泣。本是同根生，相煎何太急？", grade: 6, tags: "情感,必背" },
  { title: "出塞", author: "王昌龄", dynasty: "唐", content: "秦时明月汉时关，万里长征人未还。但使龙城飞将在，不教胡马度阴山。", grade: 6, tags: "爱国,必背" },
  { title: "春日", author: "朱熹", dynasty: "宋", content: "胜日寻芳泗水滨，无边光景一时新。等闲识得东风面，万紫千红总是春。", grade: 6, tags: "春天,哲理,必背" },
];

const EXTRA_MATH = [
  // 5年级
  { question: "一个三角形三个内角的度数比是 1:2:3，最大角是多少度？", answer: "90", options: JSON.stringify(["90", "60", "120", "45"]), type: "计算", topic: "几何", grade: 5, difficulty: "普通" },
  { question: "一根绳子长12米，剪去全长的1/4，还剩多少米？", answer: "9", options: JSON.stringify(["9", "3", "8", "10"]), type: "应用题", topic: "分数", grade: 5, difficulty: "普通" },
  { question: "小明步行速度是每分钟60米，从家到学校走了20分钟，学校距离家多少米？", answer: "1200", options: JSON.stringify(["1200", "800", "900", "1500"]), type: "应用题", topic: "比例", grade: 5, difficulty: "普通" },
  { question: "一个梯形上底6cm，下底10cm，高8cm，面积是多少cm²？", answer: "64", options: JSON.stringify(["64", "48", "80", "56"]), type: "计算", topic: "几何", grade: 5, difficulty: "普通" },
  // 6年级扩充
  { question: "一个圆柱底面半径4cm，高10cm，体积是多少cm³？（π取3.14）", answer: "502.4", options: JSON.stringify(["502.4", "251.2", "1004.8", "376.8"]), type: "计算", topic: "几何", grade: 6, difficulty: "普通" },
  { question: "甲乙两地相距360km，一辆汽车从甲地到乙地用了4小时，速度是多少km/h？", answer: "90", options: JSON.stringify(["90", "80", "100", "70"]), type: "应用题", topic: "比例", grade: 6, difficulty: "普通" },
  { question: "一件商品原价200元，打八折出售，售价是多少元？", answer: "160", options: JSON.stringify(["160", "180", "120", "140"]), type: "应用题", topic: "百分数", grade: 6, difficulty: "普通" },
  { question: "一个正方形的面积是64cm²，它的周长是多少cm？", answer: "32", options: JSON.stringify(["32", "16", "64", "28"]), type: "计算", topic: "几何", grade: 6, difficulty: "普通" },
  { question: "用60cm长的铁丝围成一个长方形，长是宽的2倍，宽是多少cm？", answer: "10", options: JSON.stringify(["10", "20", "15", "12"]), type: "应用题", topic: "几何", grade: 6, difficulty: "挑战" },
  { question: "甲的钱是乙的1.5倍，甲乙共有100元，甲有多少元？", answer: "60", options: JSON.stringify(["60", "40", "50", "75"]), type: "应用题", topic: "方程", grade: 6, difficulty: "挑战" },
  { question: "一项工程，甲队单独做需12天，乙队单独做需18天，两队合作需几天？", answer: "7.2", options: JSON.stringify(["7.2", "6", "9", "8"]), type: "应用题", topic: "方程", grade: 6, difficulty: "挑战" },
  { question: "一列火车长200米，以每秒20米的速度通过一座长800米的大桥，需要多少秒？", answer: "50", options: JSON.stringify(["50", "40", "60", "45"]), type: "应用题", topic: "比例", grade: 6, difficulty: "挑战" },
  // 判断/规律
  { question: "找规律：1, 4, 9, 16, 25, ___", answer: "36", options: JSON.stringify(["36", "30", "32", "35"]), type: "规律", topic: "整数", grade: 6, difficulty: "普通" },
  { question: "1+2+3+...+100 = ?", answer: "5050", options: JSON.stringify(["5050", "5000", "4950", "5100"]), type: "计算", topic: "整数", grade: 6, difficulty: "挑战" },
];

async function main() {
  // 检查已存在的诗词，避免重复
  const existingTitles = new Set(
    (await prisma.poem.findMany({ select: { title: true } })).map((p) => p.title)
  );
  const newPoems = EXTRA_POEMS.filter((p) => !existingTitles.has(p.title));
  if (newPoems.length > 0) {
    await prisma.poem.createMany({ data: newPoems });
    console.log(`✅ 新增古诗 ${newPoems.length} 首`);
  } else {
    console.log("ℹ️  古诗已是最新");
  }

  // 新增数学题
  const currentCount = await prisma.mathProblem.count();
  if (currentCount < 20) {
    await prisma.mathProblem.createMany({ data: EXTRA_MATH });
    console.log(`✅ 新增数学题 ${EXTRA_MATH.length} 道`);
  } else {
    console.log("ℹ️  数学题已是最新");
  }

  const totalPoems = await prisma.poem.count();
  const totalMath = await prisma.mathProblem.count();
  console.log(`📚 总计：${totalPoems} 首古诗，${totalMath} 道数学题`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
