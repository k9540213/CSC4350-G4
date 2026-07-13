import { prisma } from "./prisma";
import { getClaudeClient } from "./claude";
import { getAuthorizedGmailClient, searchCandidateMessageIds, fetchMessagesMetadataBatch } from "./gmail-client";
import { classifyAllEmails } from "./gmail-classifier";
import { upsertApplicationFromClassification } from "./gmail-matcher";

const RESYNC_MAX_RESULTS = 500; // Gmail's own per-page ceiling, used as a safety cap for resyncs

const log = (userId: string, msg: string) => console.log(`[gmail-scan][${userId}] ${msg}`);

export async function runGmailScan(userId: string, depth?: number): Promise<void> {
  log(userId, `runGmailScan invoked (depth=${depth ?? "none (resync)"})`);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.gmailConnected || !user.gmailRefreshToken) {
      throw new Error("Gmail is not connected for this user");
    }
    log(userId, `user loaded, gmailConnected=${user.gmailConnected}, gmailLastScannedAt=${user.gmailLastScannedAt ?? "null"}`);

    const isCalibration = !user.gmailLastScannedAt;
    if (isCalibration && !depth) {
      throw new Error("depth is required for the initial calibration scan");
    }
    log(userId, `mode=${isCalibration ? "calibration" : "resync"}`);

    await prisma.user.update({
      where: { id: userId },
      data: {
        scanStatus: "running",
        scanStartedAt: new Date(),
        scanProcessed: 0,
        scanTotal: 0,
        scanCreated: 0,
        scanUpdated: 0,
        scanError: null,
        ...(depth ? { scanDepth: depth } : {}),
      },
    });
    log(userId, "scanStatus set to running");

    const client = getAuthorizedGmailClient(user.gmailRefreshToken);
    const maxResults = isCalibration ? depth! : RESYNC_MAX_RESULTS;
    const after = isCalibration ? undefined : (user.gmailLastScannedAt ?? undefined);
    log(userId, `searching Gmail: maxResults=${maxResults}, after=${after ?? "none"}`);

    const candidateIds = await searchCandidateMessageIds(client, { maxResults, after });
    log(userId, `Stage A found ${candidateIds.length} candidate message id(s)`);

    const metadata = await fetchMessagesMetadataBatch(client, candidateIds);
    log(userId, `fetched metadata for ${metadata.length}/${candidateIds.length} candidate(s)`);

    await prisma.user.update({ where: { id: userId }, data: { scanTotal: metadata.length } });

    const claude = getClaudeClient();
    log(userId, `starting Stage B classification of ${metadata.length} email(s)`);
    const classifications = await classifyAllEmails(claude, metadata, async (processed, total) => {
      log(userId, `classification progress: ${processed}/${total}`);
      await prisma.user.update({ where: { id: userId }, data: { scanProcessed: processed } });
    });

    const jobRelatedCount = classifications.filter((c) => c.isJobRelated).length;
    log(userId, `Stage B complete: ${jobRelatedCount}/${classifications.length} classified as job-related`);

    let created = 0;
    let updated = 0;

    for (let i = 0; i < classifications.length; i++) {
      const result = await upsertApplicationFromClassification(userId, classifications[i], metadata[i]);
      if (result.created) {
        created++;
        log(userId, `created application: ${classifications[i].company} / ${classifications[i].position}`);
      } else if (classifications[i].isJobRelated) {
        updated++;
        log(userId, `updated existing application: ${classifications[i].company} / ${classifications[i].position} -> ${classifications[i].stage}`);
      }
    }
    log(userId, `Stage C complete: ${created} created, ${updated} updated`);

    // Watermark = the newest email actually covered by this scan, not "now" —
    // avoids clock-skew and matches what was truly checked. Only advance it
    // if we actually found candidates; otherwise leave the prior watermark alone.
    const newestDate = metadata.reduce<Date | null>(
      (max, m) => (!max || m.date > max ? m.date : max),
      null
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        scanStatus: "completed",
        scanCreated: created,
        scanUpdated: updated,
        ...(newestDate ? { gmailLastScannedAt: newestDate } : {}),
      },
    });
    log(userId, `scan completed successfully. new watermark=${newestDate?.toISOString() ?? "(unchanged)"}`);
  } catch (err) {
    console.error(`[gmail-scan][${userId}] scan failed:`, err);
    await prisma.user.update({
      where: { id: userId },
      data: { scanStatus: "failed", scanError: err instanceof Error ? err.message : String(err) },
    });
  }
}
