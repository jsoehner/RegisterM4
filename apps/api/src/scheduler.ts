import cron from "node-cron";
import { nanoid } from "nanoid";
import { loadDb, saveDb } from "./storage.js";
import { sendAttemptEmail } from "./email.js";

export type SchedulerStatus = {
  running: boolean;
  cronExpression: string;
  startedAt: string | null;
  lastTickAt: string | null;
  lastRunCompletedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  processedSchedules: number;
  createdAttempts: number;
};

type SchedulerDeps = {
  loadDb: typeof loadDb;
  saveDb: typeof saveDb;
  sendAttemptEmail: typeof sendAttemptEmail;
  now: () => Date;
};

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

function parseHourMinute(value: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error("Invalid time format. Expected HH:mm");
  }
  return { hour, minute };
}

function getZonedTimeParts(now: Date, timezone: string): { dayOfWeek: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  if (!weekday || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error("Unable to parse timezone-adjusted date parts");
  }

  return {
    dayOfWeek: weekdayMap[weekday],
    hour,
    minute
  };
}

export function createScheduler(partialDeps: Partial<SchedulerDeps> = {}) {
  const deps: SchedulerDeps = {
    loadDb,
    saveDb,
    sendAttemptEmail,
    now: () => new Date(),
    ...partialDeps
  };

  const status: SchedulerStatus = {
    running: false,
    cronExpression: "* * * * *",
    startedAt: null,
    lastTickAt: null,
    lastRunCompletedAt: null,
    lastError: null,
    lastErrorAt: null,
    processedSchedules: 0,
    createdAttempts: 0
  };

  let started = false;

  async function runDueSchedulesWithDeps(): Promise<void> {
    const now = deps.now();
    status.lastTickAt = now.toISOString();
    status.processedSchedules = 0;
    status.createdAttempts = 0;

    try {
      const db = deps.loadDb();

      for (const schedule of db.schedules) {
        if (!schedule.enabled) {
          continue;
        }

        status.processedSchedules += 1;

        const { hour, minute } = parseHourMinute(schedule.time);
        let zoned: { dayOfWeek: number; hour: number; minute: number };
        try {
          zoned = getZonedTimeParts(now, schedule.timezone);
        } catch {
          continue;
        }

        const matchesDow = zoned.dayOfWeek === schedule.dayOfWeek;
        const matchesTime = zoned.hour === hour && zoned.minute === minute;

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

        const attemptStatus = credential.verified ? "uncertain" : "failed";
        const message = credential.verified
          ? "Registration attempt executed. Outcome uncertain in MVP because site adapters are not fully implemented yet."
          : "Registration attempt skipped because credentials are not verified.";

        db.attempts.push({
          id: nanoid(),
          scheduleId: schedule.id,
          userId: user.id,
          status: attemptStatus,
          message,
          createdAt: deps.now().toISOString()
        });

        schedule.lastRunAt = now.toISOString();
        deps.saveDb(db);
        status.createdAttempts += 1;

        const subject = attemptStatus === "failed" ? "Registration Attempt Failed" : "Registration Attempt Status";
        try {
          await deps.sendAttemptEmail(user.email, subject, message);
        } catch (error) {
          console.error("Failed to send attempt email", { error, userId: user.id, scheduleId: schedule.id });
        }
      }

      status.lastRunCompletedAt = deps.now().toISOString();
      status.lastError = null;
      status.lastErrorAt = null;
    } catch (error) {
      status.lastError = error instanceof Error ? error.message : String(error);
      status.lastErrorAt = deps.now().toISOString();
    }
  }

  function start(): void {
    if (started) {
      return;
    }

    started = true;
    status.running = true;
    status.startedAt = deps.now().toISOString();

    cron.schedule(status.cronExpression, () => {
      void runDueSchedulesWithDeps();
    });
  }

  function getStatus(): SchedulerStatus {
    return { ...status };
  }

  return {
    startScheduler: start,
    runDueSchedules: runDueSchedulesWithDeps,
    getStatus
  };
}

const defaultScheduler = createScheduler();

export const startScheduler = defaultScheduler.startScheduler;
export const getSchedulerStatus = defaultScheduler.getStatus;
export const runDueSchedulesForTest = defaultScheduler.runDueSchedules;
