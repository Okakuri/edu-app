import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// DELETE /api/tasks/:id — 家长删除任务
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const task = await prisma.task.findFirst({
      where: { id, studentId: STUDENT_ID },
    });
    if (!task) return NextResponse.json({ error: "任务不存在" }, { status: 404 });

    // 先删关联完成记录
    await prisma.taskCompletion.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete task error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
