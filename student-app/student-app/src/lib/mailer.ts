import nodemailer, { type Transporter } from "nodemailer";

// SMTP settings come from env (see .env.example). Without them emails are skipped with a log line,
// so the app keeps working in development.
export function isMailConfigured() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: Transporter | null = null;
function getTransporter() {
    if (!transporter) {
        const port = Number(process.env.SMTP_PORT ?? 587);
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    }
    return transporter;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Branded wrapper for all emails. */
function layout(title: string, bodyHtml: string) {
    return `<div style="font-family:Arial,Helvetica,sans-serif;background:#F6F8F7;padding:24px">
  <div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
    <div style="background:#0077B6;color:#fff;padding:16px 24px;font-weight:700;font-size:18px">Attendance via Face</div>
    <div style="padding:24px;color:#0f172a;line-height:1.55">
      <h2 style="margin:0 0 12px;font-size:20px">${esc(title)}</h2>${bodyHtml}
    </div>
    <div style="padding:14px 24px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0">Powered by Lexical Software</div>
  </div></div>`;
}

/** Sends an email. Never throws: failures are logged and reported as `false`. */
export async function sendMail(to: string, subject: string, title: string, bodyHtml: string, text: string) {
    if (!isMailConfigured()) {
        console.warn(`[mail] SMTP not configured, skipped "${subject}"`);
        return false;
    }
    try {
        await getTransporter().sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            text,
            html: layout(title, bodyHtml),
        });
        return true;
    } catch (e) {
        console.error("[mail] send failed:", e);
        return false;
    }
}

export const mailTemplates = {
    marked(name: string, subject: string, when: Date) {
        const t = when.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
        return {
            subject: `Attendance marked: ${subject}`,
            title: "Attendance marked",
            html: `<p>Hi ${esc(name)},</p><p>Your attendance for <b>${esc(subject)}</b> was marked <b>present</b> on ${esc(t)} (IST).</p>`,
            text: `Hi ${name}, your attendance for ${subject} was marked present on ${t} (IST).`,
        };
    },
    low(name: string, subject: string, percentage: number, min: number) {
        return {
            subject: `Low attendance warning: ${subject}`,
            title: "Low attendance warning",
            html: `<p>Hi ${esc(name)},</p><p>Your attendance in <b>${esc(subject)}</b> is <b style="color:#E11D48">${percentage}%</b>, below the required ${min}%.</p><p>Please attend upcoming classes to improve it.</p>`,
            text: `Hi ${name}, your attendance in ${subject} is ${percentage}%, below the required ${min}%. Please attend upcoming classes.`,
        };
    },
};
