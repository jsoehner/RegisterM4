export type OutcomeStatus = "success" | "failed" | "uncertain";

export type AttemptSummary = {
  id: string;
  status: OutcomeStatus;
  message: string;
  createdAt: string;
};
