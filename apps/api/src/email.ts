import nodemailer from "nodemailer";
import { config } from "./config.js";

export async function sendAttemptEmail(to: string, subject: string, body: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    auth: config.smtpUser
      ? {
          user: config.smtpUser,
          pass: config.smtpPass
        }
      : undefined
  });

  await transporter.sendMail({
    from: config.smtpFrom,
    to,
    subject,
    text: body
  });
}
