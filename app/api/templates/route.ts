import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

export async function GET() {
  try {
    const templates = await prisma.taskTemplate.findMany({
      where: { studentId: STUDENT_ID, active: true },
      orderBy: { subject: "asc" },
    });
    return NextResponse.json(templates);
  } catch (err) {
    console.error("get templates error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subject, type, difficulty, estimatedMinutes, description } = body;

    if (!title || !subject || !type || !difficulty) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const xpMap: Record<string, number>    = { 普通: 15, 选做: 20, 挑战: 30 };
    const pointMap: Record<string, number> = { 普通: 8,  选做: 10, 挑战: 15 };

    const template = await prisma.taskTemplate.create({
      data: {
        title, subject, type, difficulty,
        estimatedMinutes: estimatedMinutes ?? 20,
        description: description ?? null,
        xpReward:    xpMap[difficulty]    ?? 15,
        pointReward: pointMap[difficulty]  ?? 8,
        studentId: STUDENT_ID,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("create template error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
