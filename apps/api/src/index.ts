import Fastify from "fastify";
import cors from "fastify-cors";
import { nanoid } from "nanoid";
import { z } from "zod";
import { config } from "./config.js";
import { encryptSecret, hashPassword, verifyPassword } from "./security.js";
import { loadDb, saveDb } from "./storage.js";
import { startScheduler } from "./scheduler.js";

const app = Fastify({ logger: true });
void app.register(cors, { origin: true });

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const credentialSchema = z.object({
  userId: z.string(),
  siteUrl: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1)
});

const verifyCredentialSchema = z.object({
  userId: z.string()
});

const scheduleSchema = z.object({
  userId: z.string(),
  credentialId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  timezone: z.string().min(1),
  enabled: z.boolean().default(true)
});

app.get("/health", async () => ({ ok: true }));

app.post("/auth/register", async (request, reply) => {
  const payload = registerSchema.parse(request.body);
  const db = loadDb();

  if (db.users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
    return reply.code(409).send({ error: "Email is already registered" });
  }

  const user = {
    id: nanoid(),
    email: payload.email.toLowerCase(),
    passwordHash: hashPassword(payload.password),
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  saveDb(db);

  return { id: user.id, email: user.email };
});

app.post("/auth/login", async (request, reply) => {
  const payload = loginSchema.parse(request.body);
  const db = loadDb();
  const user = db.users.find((u) => u.email === payload.email.toLowerCase());

  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }

  return { id: user.id, email: user.email };
});

app.post("/credentials", async (request, reply) => {
  const payload = credentialSchema.parse(request.body);
  const db = loadDb();

  if (!db.users.some((u) => u.id === payload.userId)) {
    return reply.code(404).send({ error: "User not found" });
  }

  const credential = {
    id: nanoid(),
    userId: payload.userId,
    siteUrl: payload.siteUrl,
    username: payload.username,
    encryptedPassword: encryptSecret(payload.password),
    verified: false,
    createdAt: new Date().toISOString()
  };

  db.credentials.push(credential);
  saveDb(db);

  return { id: credential.id, verified: credential.verified };
});

app.post("/credentials/:id/verify", async (request, reply) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const payload = verifyCredentialSchema.parse(request.body);

  const db = loadDb();
  const credential = db.credentials.find((c) => c.id === params.id && c.userId === payload.userId);

  if (!credential) {
    return reply.code(404).send({ error: "Credential not found" });
  }

  // MVP safety behavior:
  // only marks as verified if URL is reachable and uses HTTPS.
  const httpsOnly = credential.siteUrl.startsWith("https://");
  let reachable = false;

  try {
    const response = await fetch(credential.siteUrl, { method: "GET" });
    reachable = response.ok;
  } catch {
    reachable = false;
  }

  credential.verified = httpsOnly && reachable;
  credential.lastVerificationAt = new Date().toISOString();
  credential.lastVerificationMessage = credential.verified
    ? "Reachability check passed. Adapter-level login automation still required for full proof."
    : "Verification failed. Ensure HTTPS URL is reachable and provide adapter in worker for full login validation.";

  saveDb(db);

  return {
    verified: credential.verified,
    message: credential.lastVerificationMessage
  };
});

app.post("/schedules", async (request, reply) => {
  const payload = scheduleSchema.parse(request.body);
  const db = loadDb();

  if (!db.users.some((u) => u.id === payload.userId)) {
    return reply.code(404).send({ error: "User not found" });
  }

  if (!db.credentials.some((c) => c.id === payload.credentialId && c.userId === payload.userId)) {
    return reply.code(404).send({ error: "Credential not found for user" });
  }

  const schedule = {
    id: nanoid(),
    userId: payload.userId,
    credentialId: payload.credentialId,
    dayOfWeek: payload.dayOfWeek,
    time: payload.time,
    timezone: payload.timezone,
    enabled: payload.enabled,
    createdAt: new Date().toISOString()
  };

  db.schedules.push(schedule);
  saveDb(db);

  return schedule;
});

app.get("/attempts/:userId", async (request, reply) => {
  const params = z.object({ userId: z.string() }).parse(request.params);
  const db = loadDb();

  if (!db.users.some((u) => u.id === params.userId)) {
    return reply.code(404).send({ error: "User not found" });
  }

  return db.attempts.filter((a) => a.userId === params.userId);
});

const run = async (): Promise<void> => {
  try {
    startScheduler();
    await app.listen({ port: config.port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void run();
