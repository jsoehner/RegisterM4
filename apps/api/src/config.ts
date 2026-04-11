import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  appBaseUrl: required("APP_BASE_URL", "http://localhost:3000"),
  encryptionKey: required("ENCRYPTION_KEY", "dev_change_me_to_a_long_random_secret"),
  smtpHost: required("SMTP_HOST", "localhost"),
  smtpPort: Number(process.env.SMTP_PORT ?? 1025),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: required("SMTP_FROM", "no-reply@example.com")
};
