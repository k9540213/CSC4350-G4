import { prisma } from "./prisma";
import type { EmailClassification } from "./gmail-classifier";
import type { EmailMetadata } from "./gmail-client";

export function normalize(s: string): string {
  return s.trim().toLowerCase();
}

const STAGE_LABELS: Record<string, string> = {
  applied: "Application submitted",
  oa: "Online assessment",
  interview: "Interview",
  offer: "Offer received",
  rejected: "Rejected",
};

function labelFor(stage: string | null): string {
  return stage ? STAGE_LABELS[stage] ?? "Update detected" : "Update detected";
}

export async function upsertApplicationFromClassification(
  userId: string,
  classification: EmailClassification,
  emailMeta: EmailMetadata
): Promise<{ created: boolean }> {
  if (!classification.isJobRelated || !classification.company || !classification.position) {
    return { created: false };
  }

  const company = classification.company.trim();
  const position = classification.position.trim();

  const existing = await prisma.application.findFirst({
    where: {
      userId,
      company: { equals: company, mode: "insensitive" },
      position: { equals: position, mode: "insensitive" },
    },
  });

  if (existing) {
    // Gmail's after: filter is date-precision, not time-precision, so a
    // same-day resync can occasionally re-surface an already-processed
    // email. Skip if we've already recorded this exact email as an event.
    const alreadyRecorded = await prisma.statusEvent.findFirst({
      where: { applicationId: existing.id, source: "email", detail: emailMeta.snippet },
    });
    if (alreadyRecorded) {
      return { created: false };
    }

    await prisma.$transaction([
      prisma.statusEvent.create({
        data: {
          applicationId: existing.id,
          type: classification.stage ?? "note",
          label: labelFor(classification.stage),
          source: "email",
          detail: emailMeta.snippet,
          createdAt: emailMeta.date,
        },
      }),
      prisma.application.update({
        where: { id: existing.id },
        data: {
          stage: classification.stage ?? existing.stage,
          lastUpdate: new Date(),
        },
      }),
    ]);

    return { created: false };
  }

  await prisma.application.create({
    data: {
      userId,
      company,
      position,
      stage: classification.stage ?? "applied",
      source: "email",
      appliedAt: emailMeta.date,
      lastUpdate: emailMeta.date,
      statusEvents: {
        create: {
          type: classification.stage ?? "applied",
          label: labelFor(classification.stage),
          source: "email",
          detail: emailMeta.snippet,
          createdAt: emailMeta.date,
        },
      },
    },
  });

  return { created: true };
}
