import dns from "node:dns/promises";
import net from "node:net";
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
        from: process.env[`SMTP_${prefix}_FROM`] || process.env.SMTP_FROM || user,
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
      from: process.env.SMTP_FROM || gu,
      profile: "SMTP_USER",
    };
  }

  return null;
}

/**
 * Default 4: resolve hostname to IPv4 before connecting so we never pick a random AAAA
 * (Nodemailer 8 mixes A/AAAA and chooses randomly; ENETUNREACH happens when IPv6 is not routable).
 * Set SMTP_CONNECTION_FAMILY=auto to pass the hostname through unchanged.
 */
function smtpSocketFamily() {
  const raw = String(process.env.SMTP_CONNECTION_FAMILY ?? "4").trim().toLowerCase();
  if (raw === "auto" || raw === "0" || raw === "") return undefined;
  const n = Number(raw);
  if (n === 4 || n === 6) return n;
  return 4;
}

async function smtpConnectTarget(hostname, family) {
  if (!hostname) return { connectHost: "localhost", servername: undefined };
  if (family === undefined) return { connectHost: hostname, servername: undefined };
  if (net.isIP(hostname)) return { connectHost: hostname, servername: undefined };
  try {
    const { address } = await dns.lookup(hostname, { family });
    return { connectHost: address, servername: hostname };
  } catch (err) {
    console.warn(
      `[mailer] DNS lookup family=${family} for ${hostname} failed (${err.message}); using hostname`
    );
    return { connectHost: hostname, servername: undefined };
  }
}

async function getOrCreateTransporter(creds) {
  const family = smtpSocketFamily();
  const key = `${creds.host}|${creds.port}|${creds.user}|${family ?? "auto"}`;
  if (transporterCache.has(key)) {
    return transporterCache.get(key);
  }

  const { connectHost, servername } = await smtpConnectTarget(creds.host, family);

  const transport = nodemailer.createTransport({
    host: connectHost,
    port: creds.port,
    secure: Number(creds.port) === 465,
    ...(servername ? { servername } : {}),
    auth: { user: creds.user, pass: creds.pass },
  });
  transporterCache.set(key, transport);
  return transport;
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

  const transporter = await getOrCreateTransporter(creds);
  const fromName = displayNames[senderType] || "Aashansh";
  const fromEmail = creds.from || creds.user;
  const from = fromEmail.includes('<') ? fromEmail : `"${fromName}" <${fromEmail}>`;

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

async function verifyTransporters() {
  const seen = new Set();
  for (const st of ["customer", "seller", "order"]) {
    const creds = resolveSmtpCredentials(st);
    if (!creds) {
      console.warn(`[mailer] No SMTP credentials resolved for senderType="${st}"`);
      continue;
    }
    const family = smtpSocketFamily();
    const key = `${creds.host}|${creds.port}|${creds.user}|${family ?? "auto"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const t = await getOrCreateTransporter(creds);
      t.verify((error) => {
        if (error) {
          console.warn(`[mailer] SMTP verify failed (${creds.profile}):`, error.message);
        } else {
          console.log(`[mailer] SMTP ready (${creds.profile}) <${creds.user}>`);
        }
      });
    } catch (e) {
      console.warn(`[mailer] SMTP transport init failed (${creds.profile}):`, e.message);
    }
  }
}

verifyTransporters().catch((e) => console.warn("[mailer] verify bootstrap:", e.message));
