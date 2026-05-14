import { sendEmail } from "../utils/mailer.js";
import EmailLog from "../models/EmailLog.js";

/**
 * Central mail pipeline: persist log → send via Nodemailer → update status.
 * @param {Object} opts
 * @param {string} opts.templateType - logical key for analytics (e.g. seller_welcome)
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.senderType] - seller, customer, or order
 * @param {Object} [opts.meta]
 */
export async function dispatchEmail({ templateType, to, subject, html, senderType = "customer", meta = {} }) {
  if (!to || !subject) {
    console.warn("[emailService] Missing to or subject", templateType);
    return { ok: false, skipped: true };
  }

  const log = await EmailLog.create({
    templateType,
    to,
    subject,
    status: "pending",
    meta: { ...meta, senderType },
  });

  try {
    await sendEmail({ to, subject, html, senderType });
    log.status = "sent";
    await log.save();
    return { ok: true, logId: log._id };
  } catch (err) {
    log.status = "failed";
    log.errorMessage = err?.message || String(err);
    await log.save();
    console.error(`[emailService] ${templateType} (${senderType}) → ${to}:`, err?.message || err);
    return { ok: false, logId: log._id, error: log.errorMessage };
  }
}

export async function listEmailLogs({ limit = 50, skip = 0, templateType, status }) {
  const q = {};
  if (templateType) q.templateType = templateType;
  if (status) q.status = status;
  const [items, total] = await Promise.all([
    EmailLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    EmailLog.countDocuments(q),
  ]);
  return { items, total, limit, skip };
}
