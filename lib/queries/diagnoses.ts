import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** A diagnosis = a completed intake, with the problem statement the client chose. */
export async function getDiagnosis(id: string) {
  const intake = await prisma.intakeSession.findUnique({ where: { id } });
  if (!intake?.diagnosedAt) return null;
  const chosen = intake.chosenId ? await prisma.problemStatement.findUnique({ where: { id: intake.chosenId } }) : null;
  return { intake, statement: chosen?.text ?? "" };
}

export async function getDiagnosesForUser(userId: string) {
  const intakes = await prisma.intakeSession.findMany({
    where: { userId, diagnosedAt: { not: null } },
    orderBy: { diagnosedAt: "desc" }
  });
  const chosenIds = intakes.map((i) => i.chosenId).filter((x): x is string => !!x);
  const statements = await prisma.problemStatement.findMany({ where: { id: { in: chosenIds } } });
  const textById = new Map(statements.map((s) => [s.id, s.text]));
  return intakes.map((i) => ({
    id: i.id,
    diagnosedAt: i.diagnosedAt!,
    statement: (i.chosenId && textById.get(i.chosenId)) || "Problem statement"
  }));
}

/**
 * Intakes whose questions are answered but which have no diagnosis yet, typically because the
 * client's plan had no diagnostics left when they finished. They can be finished later.
 */
const pendingWhere = { diagnosedAt: null, chosenId: { not: null }, diagnosticAnswers: { not: Prisma.DbNull } };

export async function getPendingDiagnosis(id: string) {
  const intake = await prisma.intakeSession.findFirst({ where: { id, ...pendingWhere } });
  if (!intake) return null;
  const chosen = await prisma.problemStatement.findUnique({ where: { id: intake.chosenId! } });
  return { intake, statement: chosen?.text ?? "" };
}

export async function getPendingDiagnosesForUser(userId: string) {
  const intakes = await prisma.intakeSession.findMany({ where: { userId, ...pendingWhere }, orderBy: { updatedAt: "desc" } });
  const statements = await prisma.problemStatement.findMany({ where: { id: { in: intakes.map((i) => i.chosenId!) } } });
  const textById = new Map(statements.map((s) => [s.id, s.text]));
  return intakes.map((i) => ({ id: i.id, updatedAt: i.updatedAt, statement: textById.get(i.chosenId!) ?? "Problem statement" }));
}
