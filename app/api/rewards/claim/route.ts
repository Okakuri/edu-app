import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// POST /api/rewards/claim — 孩子申请兑换奖励
export async function POST(request: NextRequest) {
  try {
    const { rewardId } = await request.json();
    if (!rewardId) return NextResponse.json({ error: "缺少 rewardId" }, { status: 400 });

    const [reward, student] = await Promise.all([
      prisma.reward.findFirst({ where: { id: rewardId, active: true } }),
      prisma.student.findUnique({ where: { id: STUDENT_ID } }),
    ]);

    if (!reward) return NextResponse.json({ error: "奖励不存在" }, { status: 404 });
    if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

    // 检查星钻够不够
    if (student.points < reward.cost) {
      return NextResponse.json(
        { error: `星钻不足，还需 ${reward.cost - student.points} 颗` },
        { status: 400 }
      );
    }

    // 检查库存
    if (reward.stock > 0) {
      const usedCount = await prisma.rewardClaim.count({
        where: { rewardId, status: "approved" },
      });
      if (usedCount >= reward.stock) {
        return NextResponse.json({ error: "该奖励已被兑换完" }, { status: 400 });
      }
    }

    // 检查是否有未处理的申请
    const pending = await prisma.rewardClaim.findFirst({
      where: { rewardId, studentId: STUDENT_ID, status: "pending" },
    });
    if (pending) {
      return NextResponse.json({ error: "已有申请待家长审批" }, { status: 400 });
    }

    // 扣除星钻 + 创建申请记录（原子事务）
    const [claim] = await prisma.$transaction([
      prisma.rewardClaim.create({
        data: { rewardId, studentId: STUDENT_ID, status: "pending" },
      }),
      prisma.student.update({
        where: { id: STUDENT_ID },
        data: { points: { decrement: reward.cost } },
      }),
    ]);

    return NextResponse.json({ success: true, claimId: claim.id, cost: reward.cost });
  } catch (err) {
    console.error("claim reward error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
