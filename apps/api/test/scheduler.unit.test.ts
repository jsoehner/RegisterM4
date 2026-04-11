import assert from "node:assert/strict";
import { test } from "node:test";
import { createScheduler } from "../src/scheduler.js";
import type { Database } from "../src/types.js";

function baseDb(): Database {
  return {
    users: [
      {
        id: "u1",
        email: "user@example.com",
        passwordHash: "irrelevant",
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ],
    credentials: [
      {
        id: "c1",
        userId: "u1",
        siteUrl: "https://example.com/login",
        username: "user",
        encryptedPassword: "secret",
        verified: false,
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ],
    schedules: [
      {
        id: "s1",
        userId: "u1",
        credentialId: "c1",
        dayOfWeek: 1,
        time: "09:30",
        timezone: "America/New_York",
        enabled: true,
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ],
    attempts: []
  };
}

test("runDueSchedules creates an attempt at scheduled timezone minute", async () => {
  const db = baseDb();
  const now = new Date("2026-04-13T13:30:00.000Z"); // Monday 09:30 in America/New_York

  let saveCalls = 0;
  const sent: Array<{ to: string; subject: string; body: string }> = [];

  const scheduler = createScheduler({
    loadDb: () => db,
    saveDb: () => {
      saveCalls += 1;
    },
    sendAttemptEmail: async (to, subject, body) => {
      sent.push({ to, subject, body });
    },
    now: () => now
  });

  await scheduler.runDueSchedules();

  assert.equal(db.attempts.length, 1);
  assert.equal(db.attempts[0]?.status, "failed");
  assert.equal(saveCalls, 1);
  assert.equal(sent.length, 1);

  const status = scheduler.getStatus();
  assert.equal(status.createdAttempts, 1);
  assert.equal(status.lastError, null);
});

test("runDueSchedules keeps running when email sending fails", async () => {
  const db = baseDb();
  const now = new Date("2026-04-13T13:30:00.000Z");

  let saveCalls = 0;

  const scheduler = createScheduler({
    loadDb: () => db,
    saveDb: () => {
      saveCalls += 1;
    },
    sendAttemptEmail: async () => {
      throw new Error("SMTP unavailable");
    },
    now: () => now
  });

  await scheduler.runDueSchedules();

  assert.equal(db.attempts.length, 1);
  assert.equal(saveCalls, 1);

  const status = scheduler.getStatus();
  assert.equal(status.createdAttempts, 1);
  assert.equal(status.lastError, null);
});