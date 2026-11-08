import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");
  const difficulty = searchParams.get("difficulty");
  const count = parseInt(searchParams.get("count") ?? "5");

  try {
    const problems = await prisma.mathProblem.findMany({
      where: {
        grade: 6,
        ...(topic ? { topic } : {}),
        ...(difficulty ? { difficulty } : {}),
      },
      take: count,
      orderBy: { id: "asc" },
    });

    // 随机打乱选项顺序
    const shuffled = problems.map((p) => ({
      ...p,
      options: p.options ? JSON.parse(p.options) : null,
    }));

    return NextResponse.json(shuffled);
  } catch (error) {
    console.error("get math problems error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
