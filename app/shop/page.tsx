import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import ShopClient from "./ShopClient";

const STUDENT_ID = "student-001";

export default async function ShopPage() {
  await connection();

  const [student, rewards, claims] = await Promise.all([
    prisma.student.findUnique({ where: { id: STUDENT_ID } }),
    prisma.reward.findMany({
      where: { studentId: STUDENT_ID, active: true },
      orderBy: { cost: "asc" },
    }),
    prisma.rewardClaim.findMany({
      where: { studentId: STUDENT_ID },
      include: { reward: true },
      orderBy: { claimedAt: "desc" },
      take: 20,
    }),
  ]);

  if (!student) return null;

  return (
    <ShopClient
      points={student.points}
      rewards={rewards.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
      claims={claims.map((c) => ({
        ...c,
        claimedAt: c.claimedAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString() ?? null,
        reward: {
          ...c.reward,
          createdAt: c.reward.createdAt.toISOString(),
        },
      }))}
    />
  );
}
