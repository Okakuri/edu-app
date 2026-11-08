import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import ParentClient from "./ParentClient";

const STUDENT_ID = "student-001";

async function getPageData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [student, todayTasks, recentCompletions, rewards, pendingClaims, templates] =
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
      prisma.taskTemplate.findMany({
        where: { studentId: STUDENT_ID, active: true },
        orderBy: { subject: "asc" },
      }),
    ]);

  const serTask = (t: typeof todayTasks[number]) => ({
    ...t,
    completed: t.completions.length > 0,
    completions: undefined,
    dueDate: t.dueDate.toISOString(),
    createdAt: t.createdAt.toISOString(),
  });

  const serCompletion = (c: typeof recentCompletions[number]) => ({
    id: c.id,
    completedAt: c.completedAt.toISOString(),
    task: {
      title: c.task.title,
      subject: c.task.subject,
      xpReward: c.task.xpReward,
    },
  });

  const serReward = (r: typeof rewards[number]) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    emoji: r.emoji,
    cost: r.cost,
    stock: r.stock,
    createdAt: r.createdAt.toISOString(),
  });

  const serClaim = (c: typeof pendingClaims[number]) => ({
    id: c.id,
    status: c.status,
    claimedAt: c.claimedAt.toISOString(),
    resolvedAt: c.resolvedAt?.toISOString() ?? null,
    reward: serReward(c.reward),
  });

  const serTemplate = (t: typeof templates[number]) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    type: t.type,
    difficulty: t.difficulty,
    xpReward: t.xpReward,
    estimatedMinutes: t.estimatedMinutes,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
  });

  return {
    student,
    todayTasks:         todayTasks.map(serTask),
    recentCompletions:  recentCompletions.map(serCompletion),
    rewards:            rewards.map(serReward),
    pendingClaims:      pendingClaims.map(serClaim),
    templates:          templates.map(serTemplate),
  };
}

export default async function ParentPage() {
  await connection();
  const data = await getPageData();
  if (!data.student) return null;

  return (
    <ParentClient
      student={{ ...data.student, lastCheckin: data.student.lastCheckin?.toISOString() ?? null, createdAt: data.student.createdAt.toISOString() }}
      todayTasks={data.todayTasks}
      recentCompletions={data.recentCompletions}
      rewards={data.rewards}
      pendingClaims={data.pendingClaims}
      templates={data.templates}
    />
  );
}
