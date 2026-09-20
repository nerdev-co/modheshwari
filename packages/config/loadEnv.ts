import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { config } from "dotenv";

// Resolve .env relative to this file's location (packages/config/../../.env → repo root)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../../.env") });

/**
 * Explicitly load environment variables.
 * This is a no-op after the first call because dotenv ignores subsequent loads.
 */
export function loadAppEnv() {
  // dotenv is idempotent; the real work happens at module load above.
}

