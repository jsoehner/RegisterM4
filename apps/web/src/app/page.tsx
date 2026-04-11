"use client";

import { FormEvent, useMemo, useState } from "react";

type RegisterResponse = { id: string; email: string };
type CredentialResponse = { id: string; verified: boolean };

type VerifyResponse = { verified: boolean; message: string };

type ScheduleResponse = {
  id: string;
  userId: string;
  credentialId: string;
  dayOfWeek: number;
  time: string;
  timezone: string;
  enabled: boolean;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");

  const [siteUrl, setSiteUrl] = useState("");
  const [siteUsername, setSiteUsername] = useState("");
  const [sitePassword, setSitePassword] = useState("");
  const [credentialId, setCredentialId] = useState("");

  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [time, setTime] = useState("09:00");
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const [status, setStatus] = useState("Ready");

  async function registerUser(e: FormEvent) {
    e.preventDefault();
    const response = await fetch(`${apiBase}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      setStatus("Failed to register user");
      return;
    }

    const data = (await response.json()) as RegisterResponse;
    setUserId(data.id);
    setStatus(`User created: ${data.email}`);
  }

  async function addCredential(e: FormEvent) {
    e.preventDefault();

    const response = await fetch(`${apiBase}/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        siteUrl,
        username: siteUsername,
        password: sitePassword
      })
    });

    if (!response.ok) {
      setStatus("Failed to add credential");
      return;
    }

    const data = (await response.json()) as CredentialResponse;
    setCredentialId(data.id);
    setStatus(`Credential added: ${data.id}`);
  }

  async function verifyCredential() {
    const response = await fetch(`${apiBase}/credentials/${credentialId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      setStatus("Verification failed");
      return;
    }

    const data = (await response.json()) as VerifyResponse;
    setStatus(`Verify result: ${data.verified ? "verified" : "not verified"}. ${data.message}`);
  }

  async function createSchedule(e: FormEvent) {
    e.preventDefault();

    const response = await fetch(`${apiBase}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credentialId,
        dayOfWeek: Number(dayOfWeek),
        time,
        timezone,
        enabled: true
      })
    });

    if (!response.ok) {
      setStatus("Failed to create schedule");
      return;
    }

    const data = (await response.json()) as ScheduleResponse;
    setStatus(`Schedule created: ${data.id} (${data.dayOfWeek} ${data.time} ${data.timezone})`);
  }

  return (
    <main className="page">
      <h1>Scheduled Registration Assistant</h1>
      <p className="status">{status}</p>

      <section>
        <h2>1) Create Account</h2>
        <form onSubmit={registerUser}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Create User</button>
        </form>
        <p>User ID: {userId || "(none)"}</p>
      </section>

      <section>
        <h2>2) Add Third-Party Credential</h2>
        <form onSubmit={addCredential}>
          <input placeholder="https://example.com/login" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} required />
          <input placeholder="Site username" value={siteUsername} onChange={(e) => setSiteUsername(e.target.value)} required />
          <input
            placeholder="Site password"
            type="password"
            value={sitePassword}
            onChange={(e) => setSitePassword(e.target.value)}
            required
          />
          <button type="submit" disabled={!userId}>
            Save Credential
          </button>
        </form>
        <p>Credential ID: {credentialId || "(none)"}</p>
        <button onClick={verifyCredential} disabled={!credentialId || !userId}>
          Verify Credential
        </button>
      </section>

      <section>
        <h2>3) Schedule Registration Attempt</h2>
        <form onSubmit={createSchedule}>
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </select>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          <button type="submit" disabled={!credentialId || !userId}>
            Create Schedule
          </button>
        </form>
      </section>
    </main>
  );
}
