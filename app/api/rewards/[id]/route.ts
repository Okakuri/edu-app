import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// DELETE /api/rewards/:id — 家长删除奖励
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.reward.update({
      where: { id, studentId: STUDENT_ID },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete reward error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
