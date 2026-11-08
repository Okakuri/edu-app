import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import PracticeClient from "./PracticeClient";

async function getPageData() {
  const [poems, mathProblems] = await Promise.all([
    prisma.poem.findMany({ orderBy: [{ grade: "asc" }, { id: "asc" }] }),
    prisma.mathProblem.findMany({
      where: { grade: 6 },
      orderBy: { id: "asc" },
    }),
  ]);

  return {
    poems,
    mathProblems: mathProblems.map((p) => ({
      ...p,
      options: p.options ? JSON.parse(p.options) : null,
    })),
  };
}

export default async function PracticePage() {
  await connection();
  const { poems, mathProblems } = await getPageData();

  return <PracticeClient poems={poems} mathProblems={mathProblems} />;
}
