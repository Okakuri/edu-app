import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

export async function GET() {
  try {
    const student = await prisma.student.findUnique({
      where: { id: STUDENT_ID },
      include: { _count: { select: { completions: true } } },
    });
    if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    return NextResponse.json(student);
  } catch (err) {
    console.error("get student error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// PATCH /api/student — 修改名字/年级
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, grade } = body;

    const data: Record<string, string | number> = {};
    if (name && typeof name === "string" && name.trim()) data.name = name.trim();
    if (grade && typeof grade === "number" && grade >= 1 && grade <= 6) data.grade = grade;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "没有可更新的字段" }, { status: 400 });
    }

    const student = await prisma.student.update({
      where: { id: STUDENT_ID },
      data,
    });
    return NextResponse.json(student);
  } catch (err) {
    console.error("update student error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
