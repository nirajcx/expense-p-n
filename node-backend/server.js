import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool, checkDatabase } from "./database/pool.js";

try {
  console.log("Checking PostgreSQL connection...");
  await checkDatabase();
  console.log("PostgreSQL connection ready");
} catch {
  console.error("Database unavailable. Check DATABASE_URL and PostgreSQL.");
  await pool.end();
  process.exit(1);
}
const server = app.listen(env.PORT, env.HOST, (error) => {
  if (error) return; // Express also invokes this callback on listen failures.
  console.log(`Express listening at http://${env.HOST}:${env.PORT}`);
});
server.on("error", async (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? "HTTP port is already in use"
      : "HTTP server could not start",
  );
  await pool.end();
  process.exit(1);
});
let stopping = false;
function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`${signal}: closing HTTP server and database pool...`);
  setTimeout(() => {
    console.error("Shutdown exceeded 10 seconds; exiting");
    process.exit(1);
  }, 10_000).unref();
  server.close(async () => {
    try {
      await pool.end();
      console.log("Shutdown complete");
      process.exit(0);
    } catch {
      console.error("Database pool cleanup failed");
      process.exit(1);
    }
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
