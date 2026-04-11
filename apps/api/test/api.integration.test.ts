import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildApp } from "../src/app.js";

function makeTempDataDir(): string {
  return mkdtempSync(path.join(tmpdir(), "registerm4-api-test-"));
}

test("register validation returns 400 with issues", async () => {
  const originalDir = process.env.API_DATA_DIR;
  const tempDir = makeTempDataDir();
  process.env.API_DATA_DIR = tempDir;

  const app = buildApp();
  try {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "bad", password: "123" }
    });

    assert.equal(response.statusCode, 400);
    const body = response.json();
    assert.equal(body.error, "Validation error");
    assert.ok(Array.isArray(body.issues));
    assert.ok(body.issues.length >= 1);
  } finally {
    await app.close();
    process.env.API_DATA_DIR = originalDir;
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("schedule creation returns 404 when credential does not belong to user", async () => {
  const originalDir = process.env.API_DATA_DIR;
  const tempDir = makeTempDataDir();
  process.env.API_DATA_DIR = tempDir;

  const app = buildApp();
  try {
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "tester@example.com", password: "password123" }
    });
    assert.equal(registerResponse.statusCode, 200);
    const user = registerResponse.json() as { id: string };

    const response = await app.inject({
      method: "POST",
      url: "/schedules",
      payload: {
        userId: user.id,
        credentialId: "missing-credential",
        dayOfWeek: 1,
        time: "09:00",
        timezone: "America/New_York",
        enabled: true
      }
    });

    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error, "Credential not found for user");
  } finally {
    await app.close();
    process.env.API_DATA_DIR = originalDir;
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("scheduler status endpoint responds with health payload", async () => {
  const originalDir = process.env.API_DATA_DIR;
  const tempDir = makeTempDataDir();
  process.env.API_DATA_DIR = tempDir;

  const app = buildApp();
  try {
    const response = await app.inject({ method: "GET", url: "/scheduler/status" });

    assert.equal(response.statusCode, 200);
    const body = response.json() as {
      running: boolean;
      cronExpression: string;
      startedAt: string | null;
    };

    assert.equal(typeof body.running, "boolean");
    assert.equal(body.cronExpression, "* * * * *");
    assert.equal(body.startedAt, null);
  } finally {
    await app.close();
    process.env.API_DATA_DIR = originalDir;
    rmSync(tempDir, { recursive: true, force: true });
  }
});