import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import DashboardClient from "./DashboardClient";

const STUDENT_ID = "student-001";

async function getPageData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [student, tasks] = await Promise.all([
    prisma.student.findUnique({ where: { id: STUDENT_ID } }),
    prisma.task.findMany({
      where: {
        studentId: STUDENT_ID,
        dueDate: { gte: today, lt: tomorrow },
      },
      include: {
        completions: {
          where: { studentId: STUDENT_ID, completedAt: { gte: today } },
        },
      },
      orderBy: { subject: "asc" },
    }),
  ]);

  return { student, tasks };
}

export default async function HomePage() {
  await connection();
  const { student, tasks } = await getPageData();

  if (!student) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">数据加载失败，请刷新页面</p>
      </div>
    );
  }

  const tasksWithStatus = tasks.map((t) => ({
    ...t,
    completed: t.completions.length > 0,
    completions: undefined,
    dueDate: t.dueDate.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }));

  const studentData = {
    ...student,
    lastCheckin: student.lastCheckin?.toISOString() ?? null,
    createdAt: student.createdAt.toISOString(),
  };

  return <DashboardClient student={studentData} initialTasks={tasksWithStatus} />;
}
