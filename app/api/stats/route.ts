import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// GET /api/stats — 返回最近7天每天的完成任务数和XP
export async function GET() {
  try {
    const days: { date: string; label: string; count: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const count = await prisma.taskCompletion.count({
        where: {
          studentId: STUDENT_ID,
          completedAt: { gte: d, lt: next },
        },
      });

      days.push({
        date: d.toISOString().slice(0, 10),
        label: i === 0 ? "今天" : ["日","一","二","三","四","五","六"][d.getDay()] ,
        count,
      });
    }

    // 本周总完成数
    const weekTotal = days.reduce((s, d) => s + d.count, 0);

    // 最长连续天数（重新计算）
    const allCompletions = await prisma.taskCompletion.findMany({
      where: { studentId: STUDENT_ID },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    const uniqueDays = new Set(
      allCompletions.map((c) => c.completedAt.toISOString().slice(0, 10))
    );

    return NextResponse.json({ days, weekTotal, activeDays: uniqueDays.size });
  } catch (err) {
    console.error("stats error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
