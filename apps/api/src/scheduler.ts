import cron from "node-cron";
import { nanoid } from "nanoid";
import { loadDb, saveDb } from "./storage.js";
import { sendAttemptEmail } from "./email.js";

function parseHourMinute(value: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error("Invalid time format. Expected HH:mm");
  }
  return { hour, minute };
}

async function runDueSchedules(): Promise<void> {
  const db = loadDb();
  const now = new Date();

  for (const schedule of db.schedules) {
    if (!schedule.enabled) {
      continue;
    }

    const { hour, minute } = parseHourMinute(schedule.time);
    const todayDow = now.getDay();
    const matchesDow = todayDow === schedule.dayOfWeek;
    const matchesTime = now.getHours() === hour && now.getMinutes() === minute;

    const alreadyRanThisMinute = schedule.lastRunAt
      ? Math.floor(new Date(schedule.lastRunAt).getTime() / 60000) === Math.floor(now.getTime() / 60000)
      : false;

    if (!matchesDow || !matchesTime || alreadyRanThisMinute) {
      continue;
    }

    const user = db.users.find((u) => u.id === schedule.userId);
    const credential = db.credentials.find((c) => c.id === schedule.credentialId);

    if (!user || !credential) {
      continue;
    }

    const status = credential.verified ? "uncertain" : "failed";
    const message = credential.verified
      ? "Registration attempt executed. Outcome uncertain in MVP because site adapters are not fully implemented yet."
      : "Registration attempt skipped because credentials are not verified.";

    db.attempts.push({
      id: nanoid(),
      scheduleId: schedule.id,
      userId: user.id,
      status,
      message,
      createdAt: new Date().toISOString()
    });

    schedule.lastRunAt = now.toISOString();
    saveDb(db);

    const subject = status === "failed" ? "Registration Attempt Failed" : "Registration Attempt Status";
    await sendAttemptEmail(user.email, subject, message);
  }
}

export function startScheduler(): void {
  cron.schedule("* * * * *", () => {
    void runDueSchedules();
  });
}
