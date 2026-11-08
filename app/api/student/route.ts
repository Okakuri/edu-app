import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

export async function GET() {
  try {
    const student = await prisma.student.findUnique({
      where: { id: STUDENT_ID },
      include: {
        _count: {
          select: { completions: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("get student error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
