import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import ParentClient from "./ParentClient";

const STUDENT_ID = "student-001";

async function getPageData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [student, todayTasks, recentCompletions, rewards, pendingClaims] =
    await Promise.all([
      prisma.student.findUnique({ where: { id: STUDENT_ID } }),
      prisma.task.findMany({
        where: { studentId: STUDENT_ID, dueDate: { gte: today, lt: tomorrow } },
        include: { completions: { where: { completedAt: { gte: today } } } },
        orderBy: { subject: "asc" },
      }),
      prisma.taskCompletion.findMany({
        where: { studentId: STUDENT_ID },
        orderBy: { completedAt: "desc" },
        take: 5,
        include: { task: true },
      }),
      prisma.reward.findMany({
        where: { studentId: STUDENT_ID, active: true },
        orderBy: { cost: "asc" },
      }),
      prisma.rewardClaim.findMany({
        where: { studentId: STUDENT_ID, status: "pending" },
        include: { reward: true },
        orderBy: { claimedAt: "asc" },
      }),
    ]);

  return {
    student,
    todayTasks: todayTasks.map((t) => ({
      ...t,
      completed: t.completions.length > 0,
      completions: undefined,
      dueDate: t.dueDate.toISOString(),
      createdAt: t.createdAt.toISOString(),
    })),
    recentCompletions: recentCompletions.map((c) => ({
      ...c,
      completedAt: c.completedAt.toISOString(),
      task: { ...c.task, dueDate: c.task.dueDate.toISOString(), createdAt: c.task.createdAt.toISOString() },
    })),
    rewards: rewards.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    pendingClaims: pendingClaims.map((c) => ({
      ...c,
      claimedAt: c.claimedAt.toISOString(),
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
      reward: { ...c.reward, createdAt: c.reward.createdAt.toISOString() },
    })),
  };
}

export default async function ParentPage() {
  await connection();
  const { student, todayTasks, recentCompletions, rewards, pendingClaims } =
    await getPageData();

  if (!student) return null;

  return (
    <ParentClient
      student={{ ...student, lastCheckin: student.lastCheckin?.toISOString() ?? null, createdAt: student.createdAt.toISOString() }}
      todayTasks={todayTasks}
      recentCompletions={recentCompletions}
      rewards={rewards}
      pendingClaims={pendingClaims}
    />
  );
}
