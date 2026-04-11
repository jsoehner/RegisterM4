export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type Credential = {
  id: string;
  userId: string;
  siteUrl: string;
  username: string;
  encryptedPassword: string;
  verified: boolean;
  lastVerificationAt?: string;
  lastVerificationMessage?: string;
  createdAt: string;
};

export type Schedule = {
  id: string;
  userId: string;
  credentialId: string;
  dayOfWeek: number;
  time: string;
  timezone: string;
  enabled: boolean;
  createdAt: string;
  lastRunAt?: string;
};

export type AttemptStatus = "success" | "failed" | "uncertain";

export type Attempt = {
  id: string;
  scheduleId: string;
  userId: string;
  status: AttemptStatus;
  message: string;
  createdAt: string;
};

export type Database = {
  users: User[];
  credentials: Credential[];
  schedules: Schedule[];
  attempts: Attempt[];
};
