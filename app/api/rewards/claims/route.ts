import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUDENT_ID = "student-001";

// GET /api/rewards/claims — 家长查看所有兑换申请
export async function GET() {
  try {
    const claims = await prisma.rewardClaim.findMany({
      where: { studentId: STUDENT_ID },
      include: { reward: true },
      orderBy: { claimedAt: "desc" },
      take: 30,
    });
    return NextResponse.json(claims);
  } catch (err) {
    console.error("get claims error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// PATCH /api/rewards/claims — 家长审批（approve / reject）
export async function PATCH(request: NextRequest) {
  try {
    const { claimId, action } = await request.json(); // action: "approve" | "reject"
    if (!claimId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const claim = await prisma.rewardClaim.findUnique({
      where: { id: claimId },
      include: { reward: true },
    });
    if (!claim) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    if (claim.status !== "pending") {
      return NextResponse.json({ error: "该申请已处理" }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.rewardClaim.update({
        where: { id: claimId },
        data: { status: "approved", resolvedAt: new Date() },
      });
    } else {
      // 拒绝时退还星钻
      await prisma.$transaction([
        prisma.rewardClaim.update({
          where: { id: claimId },
          data: { status: "rejected", resolvedAt: new Date() },
        }),
        prisma.student.update({
          where: { id: STUDENT_ID },
          data: { points: { increment: claim.reward.cost } },
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("approve/reject claim error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
