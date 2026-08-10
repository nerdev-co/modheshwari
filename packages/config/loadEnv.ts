import { config } from "dotenv";
import { join } from "path";

// Auto-load environment variables from the monorepo root .env file on first import.
config({ path: join(process.cwd(), "../../.env") });

