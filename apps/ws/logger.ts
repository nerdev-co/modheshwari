type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
} as const;

const envPretty = process.env.LOG_PRETTY
  ? process.env.LOG_PRETTY === "true"
  : process.env.NODE_ENV !== "production";
const envLevel = (process.env.LOG_LEVEL?.toUpperCase() || "DEBUG") as LogLevel;
const minLevel = LEVEL_ORDER[envLevel] ?? LEVEL_ORDER.DEBUG;

const COLORS: Record<LogLevel, string> = {
  DEBUG: "\u001b[36m", // cyan
  INFO: "\u001b[32m", // green
  WARN: "\u001b[33m", // yellow
  ERROR: "\u001b[31m", // red
} as const;

const RESET = "\u001b[0m";

/**
 * Performs safe stringify operation.
 * @param {unknown} v - Description of v
 * @returns {string} Description of return value
 */
function safeStringify(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === null) return "null";
  if (v === undefined) return "undefined";

  try {
    return JSON.stringify(v, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
  } catch {
    return String(v);
  }
}

/**
 * Performs format json operation.
 * @param {LogLevel} level - Description of level
 * @param {unknown} msg - Description of msg
 * @param {unknown} meta - Description of meta
 * @returns {string} Description of return value
 */
function formatJSON(level: LogLevel, msg: unknown, meta?: unknown): string {
  const base: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    service: "ws",
    level,
  };

  if (meta instanceof Error) {
    const errorPayload: Record<string, unknown> = {
      message: meta.message,
      stack: meta.stack,
    };
    if (meta.cause !== undefined) errorPayload.cause = meta.cause;

    return JSON.stringify({
      ...base,
      message: String(msg),
      error: errorPayload,
    });
  }

  if (typeof msg === "object" && msg !== null) {
    const payload: Record<string, unknown> = {
      ...base,
      ...(msg as Record<string, unknown>),
    };
    if (meta !== undefined) payload.meta = meta;
    return JSON.stringify(payload);
  }

  const payload: Record<string, unknown> = {
    ...base,
    message: String(msg),
  };
  if (meta !== undefined) payload.meta = meta;
  return JSON.stringify(payload);
}

/**
 * Performs format pretty operation.
 * @param {LogLevel} level - Description of level
 * @param {unknown} msg - Description of msg
 * @param {unknown} meta - Description of meta
 * @returns {string} Description of return value
 */
function formatPretty(level: LogLevel, msg: unknown, meta?: unknown): string {
  const ts = new Date().toISOString();
  const color = COLORS[level];
  const header = `${color}${level.padEnd(5)}${RESET}`;
  const message = typeof msg === "string" ? msg : safeStringify(msg);

  let metaStr = "";
  if (meta instanceof Error) {
    metaStr = `\n  ${COLORS.ERROR}${meta.stack || meta.message}${RESET}`;
  } else if (meta !== undefined) {
    try {
      metaStr = `\n  ${JSON.stringify(meta, null, 2)}`;
    } catch {
      metaStr = `\n  ${String(meta)}`;
    }
  }

  return `[${ts}] ${header} ${message}${metaStr}`;
}

/**
 * Performs should log operation.
 * @param {LogLevel} level - Description of level
 * @returns {boolean} Description of return value
 */
function shouldLog(level: LogLevel): boolean {
  return (LEVEL_ORDER[level] ?? 0) >= minLevel;
}

/**
 * Performs write operation.
 * @param {LogLevel} level - Description of level
 * @param {unknown} msg - Description of msg
 * @param {unknown} meta - Description of meta
 * @returns {void} Description of return value
 */
function write(level: LogLevel, msg: unknown, meta?: unknown): void {
  if (!shouldLog(level)) return;

  const out = envPretty ? formatPretty(level, msg, meta) : formatJSON(level, msg, meta);
  const stream =
    level === "ERROR" || level === "WARN" ? process.stderr : process.stdout;
  stream.write(out + "\n");
}

export const logger = {
  debug: (msg: unknown, meta?: unknown) => write("DEBUG", msg, meta),
  info: (msg: unknown, meta?: unknown) => write("INFO", msg, meta),
  warn: (msg: unknown, meta?: unknown) => write("WARN", msg, meta),
  error: (msg: unknown, meta?: unknown) => write("ERROR", msg, meta),

  // Child logger with context
  child: (context: Record<string, unknown>) => ({
    debug: (msg: unknown, meta?: unknown) => {
      const merged =
        meta && typeof meta === "object"
          ? { ...context, ...(meta as Record<string, unknown>) }
          : { ...context, meta };
      write("DEBUG", msg, merged);
    },
    info: (msg: unknown, meta?: unknown) => {
      const merged =
        meta && typeof meta === "object"
          ? { ...context, ...(meta as Record<string, unknown>) }
          : { ...context, meta };
      write("INFO", msg, merged);
    },
    warn: (msg: unknown, meta?: unknown) => {
      const merged =
        meta && typeof meta === "object"
          ? { ...context, ...(meta as Record<string, unknown>) }
          : { ...context, meta };
      write("WARN", msg, merged);
    },
    error: (msg: unknown, meta?: unknown) => {
      const merged =
        meta && typeof meta === "object"
          ? { ...context, ...(meta as Record<string, unknown>) }
          : { ...context, meta };
      write("ERROR", msg, merged);
    },
  }),
} as const;

export default logger;