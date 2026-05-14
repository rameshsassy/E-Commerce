import nodemailer from "nodemailer";

const transporterCache = new Map();

/**
 * Resolve SMTP credentials for a logical sender type.
 * Tries role-specific env vars first, then other roles, then generic SMTP_USER/SMTP_PASS.
 * This fixes "SMTP works in my test" when the test used one account but only SELLER (or a single SMTP_USER) is set in .env.
 */
export function resolveSmtpCredentials(senderType = "customer") {
  const role = String(senderType || "customer").toLowerCase();
  const priority = {
    customer: ["CUSTOMER", "SELLER", "ORDER"],
    seller: ["SELLER", "CUSTOMER", "ORDER"],
    order: ["ORDER", "SELLER", "CUSTOMER"],
  };
  const order = priority[role] || priority.customer;

  for (const prefix of order) {
    const user = process.env[`SMTP_${prefix}_USER`];
    const pass = process.env[`SMTP_${prefix}_PASS`];
    if (user && pass) {
      return {
        host: process.env[`SMTP_${prefix}_HOST`] || process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env[`SMTP_${prefix}_PORT`] || process.env.SMTP_PORT || 587),
        user,
        pass,
        profile: prefix,
      };
    }
  }

  const gu = process.env.SMTP_USER;
  const gp = process.env.SMTP_PASS;
  if (gu && gp) {
    return {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      user: gu,
      pass: gp,
      profile: "SMTP_USER",
    };
  }

  return null;
}

function getOrCreateTransporter(creds) {
  const key = `${creds.host}|${creds.port}|${creds.user}`;
  if (!transporterCache.has(key)) {
    transporterCache.set(
      key,
      nodemailer.createTransport({
        host: creds.host,
        port: creds.port,
        secure: Number(creds.port) === 465,
        auth: { user: creds.user, pass: creds.pass },
      })
    );
  }
  return transporterCache.get(key);
}

const displayNames = {
  seller: "Aashansh Seller Care",
  customer: "Aashansh Customer Care",
  order: "Aashansh Orders",
};

/**
 * Send email using resolved SMTP credentials for the sender role.
 */
export const sendEmail = async ({ to, subject, html, senderType = "customer" }) => {
  const creds = resolveSmtpCredentials(senderType);
  if (!creds) {
    throw new Error(
      `No SMTP credentials for "${senderType}". Set SMTP_CUSTOMER_USER and SMTP_CUSTOMER_PASS, or SMTP_SELLER_* / SMTP_ORDER_*, or generic SMTP_USER and SMTP_PASS.`
    );
  }

  const transporter = getOrCreateTransporter(creds);
  const fromName = displayNames[senderType] || "Aashansh";
  const from = `"${fromName}" <${creds.user}>`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(
      `[mailer] ${senderType} (SMTP profile ${creds.profile}) → ${to} messageId=%s`,
      info.messageId
    );
    return info;
  } catch (error) {
    console.error(
      `[mailer] ${senderType} send failed (profile ${creds.profile}, user ${creds.user}):`,
      error.message
    );
    throw error;
  }
};

function verifyTransporters() {
  const seen = new Set();
  for (const st of ["customer", "seller", "order"]) {
    const creds = resolveSmtpCredentials(st);
    if (!creds) {
      console.warn(`[mailer] No SMTP credentials resolved for senderType="${st}"`);
      continue;
    }
    const key = `${creds.host}|${creds.port}|${creds.user}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const t = getOrCreateTransporter(creds);
    t.verify((error) => {
      if (error) {
        console.warn(`[mailer] SMTP verify failed (${creds.profile}):`, error.message);
      } else {
        console.log(`[mailer] SMTP ready (${creds.profile}) <${creds.user}>`);
      }
    });
  }
}

verifyTransporters();
