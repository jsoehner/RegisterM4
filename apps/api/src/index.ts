import { pathToFileURL } from "node:url";
import { config } from "./config.js";
import { buildApp } from "./app.js";
import { startScheduler } from "./scheduler.js";

export const app = buildApp();

const run = async (): Promise<void> => {
  try {
    startScheduler();
    await app.listen({ port: config.port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

const isMain = process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false;

if (isMain) {
  void run();
}
