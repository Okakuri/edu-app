import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// GET /api/rewards — 获取所有可用奖励
export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      where: { studentId: STUDENT_ID, active: true },
      include: {
        _count: { select: { claims: { where: { status: "approved" } } } },
        claims: {
          where: { studentId: STUDENT_ID, status: "pending" },
          orderBy: { claimedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { cost: "asc" },
    });

    return NextResponse.json(rewards);
  } catch (err) {
    console.error("get rewards error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// POST /api/rewards — 家长创建奖励
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, emoji, cost, stock } = body;

    if (!title || cost == null) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const reward = await prisma.reward.create({
      data: {
        title,
        description: description || null,
        emoji: emoji || "🎁",
        cost: parseInt(cost),
        stock: stock != null ? parseInt(stock) : -1,
        studentId: STUDENT_ID,
      },
    });

    return NextResponse.json(reward, { status: 201 });
  } catch (err) {
    console.error("create reward error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
