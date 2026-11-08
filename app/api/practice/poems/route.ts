import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get("grade");

  try {
    const poems = await prisma.poem.findMany({
      where: grade ? { grade: parseInt(grade) } : undefined,
      orderBy: [{ grade: "asc" }, { title: "asc" }],
    });

    return NextResponse.json(poems);
  } catch (error) {
    console.error("get poems error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
