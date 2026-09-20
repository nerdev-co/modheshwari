/**
 * WebSocket Server Entry Point
 * 
 * Modular WebSocket server for real-time notifications and chat.
 */

import { startServer, shutdown } from "./server";

// Start the server (awaited to catch async errors)
startServer().catch((err) => {
    console.error("Fatal: failed to start ws server", err);
    process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
