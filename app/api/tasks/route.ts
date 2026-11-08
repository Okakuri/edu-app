import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// 从模板为今日生成任务（幂等：已生成则跳过）
async function ensureTodayTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 检查今天是否已经从模板生成过
  const existingCount = await prisma.task.count({
    where: { studentId: STUDENT_ID, dueDate: { gte: today, lt: tomorrow } },
  });
  if (existingCount > 0) return; // 已生成，跳过

  // 读取所有启用的模板
  const templates = await prisma.taskTemplate.findMany({
    where: { studentId: STUDENT_ID, active: true },
  });
  if (templates.length === 0) return;

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 0);

  await prisma.task.createMany({
    data: templates.map((t) => ({
      title: t.title,
      subject: t.subject,
      type: t.type,
      difficulty: t.difficulty,
      xpReward: t.xpReward,
      pointReward: t.pointReward,
      estimatedMinutes: t.estimatedMinutes,
      description: t.description,
      studentId: STUDENT_ID,
      dueDate: todayEnd,
    })),
  });
}

// GET /api/tasks — 获取今日任务（自动从模板生成）
export async function GET() {
  try {
    await ensureTodayTasks();

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
          where: { studentId: STUDENT_ID, completedAt: { gte: today } },
        },
      },
      orderBy: { subject: "asc" },
    });

    return NextResponse.json(
      tasks.map((t) => ({ ...t, completed: t.completions.length > 0, completions: undefined }))
    );
  } catch (err) {
    console.error("get tasks error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// POST /api/tasks — 家长临时新增今日单次任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subject, type, difficulty, estimatedMinutes, description } = body;

    if (!title || !subject || !type || !difficulty) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const xpMap: Record<string, number>    = { 普通: 15, 选做: 20, 挑战: 30 };
    const pointMap: Record<string, number> = { 普通: 8,  选做: 10, 挑战: 15 };

    const today = new Date();
    today.setHours(23, 59, 59, 0);

    const task = await prisma.task.create({
      data: {
        title, subject, type, difficulty,
        estimatedMinutes: estimatedMinutes ?? 20,
        description: description ?? null,
        xpReward:    xpMap[difficulty]   ?? 15,
        pointReward: pointMap[difficulty] ?? 8,
        studentId: STUDENT_ID,
        dueDate: today,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("create task error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
