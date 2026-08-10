import { config } from "dotenv";
import { join } from "path";

// Auto-load environment variables from the monorepo root .env file on first import.
config({ path: join(process.cwd(), "../../.env") });

/**
 * Explicitly load environment variables.
 * This is a no-op after the first call because dotenv ignores subsequent loads.
 */
export function loadAppEnv() {
  // dotenv is idempotent; the real work happens at module load above.
}

