import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// POST /api/practice/complete  — 练习完成后奖励 XP
export async function POST(request: NextRequest) {
  try {
    const { type, score, total } = await request.json();
    // type: "math" | "poem"
    // score: 答对题数
    // total: 总题数

    if (!type || total == null) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id: STUDENT_ID } });
    if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

    // 根据正确率计算奖励
    const accuracy = total > 0 ? score / total : 0;
    let baseXp = 0;
    let basePoints = 0;

    if (type === "math") {
      baseXp = Math.round(5 + score * 4);         // 每道答对 +4 XP
      basePoints = Math.round(2 + score * 2);
    } else if (type === "poem") {
      baseXp = Math.round(8 + score * 5);         // 古诗填空难度更高
      basePoints = Math.round(3 + score * 2);
    }

    // 满分加成
    const bonus = accuracy >= 1.0 ? 1.5 : accuracy >= 0.8 ? 1.2 : 1.0;
    const xpGained = Math.round(baseXp * bonus);
    const pointsGained = Math.round(basePoints * bonus);

    const newXp = student.xp + xpGained;
    const newPoints = student.points + pointsGained;

    // 升级判断
    let newLevel = student.level;
    while (newXp >= newLevel * (newLevel + 1) * 50) newLevel++;

    await prisma.student.update({
      where: { id: STUDENT_ID },
      data: { xp: newXp, points: newPoints, level: newLevel },
    });

    return NextResponse.json({
      xpGained, pointsGained, newXp, newPoints, newLevel,
      levelUp: newLevel > student.level,
      perfect: accuracy >= 1.0,
      bonus,
    });
  } catch (err) {
    console.error("practice/complete error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
