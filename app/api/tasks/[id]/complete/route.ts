import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  try {
    // 检查任务是否存在且属于该学生
    const task = await prisma.task.findFirst({
      where: { id: taskId, studentId: STUDENT_ID },
      include: { completions: { where: { studentId: STUDENT_ID } } },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // 检查今天是否已完成
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadyDone = task.completions.some(
      (c) => new Date(c.completedAt) >= today
    );

    if (alreadyDone) {
      return NextResponse.json({ error: "今天已经完成了" }, { status: 400 });
    }

    // 获取学生当前数据
    const student = await prisma.student.findUnique({
      where: { id: STUDENT_ID },
    });
    if (!student) {
      return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    }

    // 计算连续打卡
    const lastCheckin = student.lastCheckin
      ? new Date(student.lastCheckin)
      : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const wasYesterday =
      lastCheckin &&
      lastCheckin >= yesterday &&
      lastCheckin < today;

    const newStreak = wasYesterday ? student.streak + 1 : 1;

    // 连续打卡加成
    let streakBonus = 1.0;
    if (newStreak >= 7) streakBonus = 1.5;
    else if (newStreak >= 3) streakBonus = 1.2;

    const xpGained = Math.round(task.xpReward * streakBonus);
    const pointsGained = Math.round(task.pointReward * streakBonus);
    const newXp = student.xp + xpGained;
    const newPoints = student.points + pointsGained;

    // 简单升级逻辑：每 100*level XP 升一级
    let newLevel = student.level;
    let totalXpForLevel = newLevel * (newLevel + 1) * 50;
    while (newXp >= totalXpForLevel) {
      newLevel++;
      totalXpForLevel = newLevel * (newLevel + 1) * 50;
    }

    // 事务：记录完成 + 更新学生数据
    await prisma.$transaction([
      prisma.taskCompletion.create({
        data: { taskId, studentId: STUDENT_ID },
      }),
      prisma.student.update({
        where: { id: STUDENT_ID },
        data: {
          xp: newXp,
          points: newPoints,
          level: newLevel,
          streak: newStreak,
          lastCheckin: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      xpGained,
      pointsGained,
      newXp,
      newPoints,
      newLevel,
      newStreak,
      levelUp: newLevel > student.level,
      streakBonus,
    });
  } catch (error) {
    console.error("complete task error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
