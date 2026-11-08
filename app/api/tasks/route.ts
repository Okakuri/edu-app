import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// GET /api/tasks — 获取今日任务及完成状态
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        studentId: STUDENT_ID,
        dueDate: { gte: today, lt: tomorrow },
      },
      include: {
        completions: {
          where: {
            studentId: STUDENT_ID,
            completedAt: { gte: today },
          },
        },
      },
      orderBy: { subject: "asc" },
    });

    const result = tasks.map((t) => ({
      ...t,
      completed: t.completions.length > 0,
      completions: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("get tasks error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// POST /api/tasks — 家长新增任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subject, type, difficulty, estimatedMinutes, description } =
      body;

    if (!title || !subject || !type || !difficulty) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const xpMap: Record<string, number> = { 普通: 15, 选做: 20, 挑战: 30 };
    const pointMap: Record<string, number> = { 普通: 8, 选做: 10, 挑战: 15 };

    const today = new Date();
    today.setHours(23, 59, 59, 0);

    const task = await prisma.task.create({
      data: {
        title,
        subject,
        type,
        difficulty,
        estimatedMinutes: estimatedMinutes ?? 20,
        description: description ?? null,
        xpReward: xpMap[difficulty] ?? 15,
        pointReward: pointMap[difficulty] ?? 8,
        studentId: STUDENT_ID,
        dueDate: today,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("create task error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
