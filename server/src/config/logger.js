const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");

const { combine, timestamp, colorize, printf, json } = format;

const isProduction = process.env.NODE_ENV === "production";

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const extras = Object.keys(meta).length
    ? ` ${JSON.stringify(meta)}`
    : "";

  return `${timestamp} [${level}]: ${message}${extras}`;
});

const loggerTransports = [
  new transports.Console({
    format: isProduction
      ? combine(timestamp(), json())
      : combine(
        timestamp({ format: "HH:mm:ss" }),
        colorize(),
        devFormat
      ),
  }),
];

// Optional: Keep file logging only for local development
if (!isProduction) {
  const logDir = path.join(process.cwd(), "logs");

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  loggerTransports.push(
    new transports.File({
      filename: path.join(logDir, "combined.log"),
    })
  );

  loggerTransports.push(
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    })
  );
}

const logger = createLogger({
  level: isProduction ? "info" : "debug",
  transports: loggerTransports,
});

module.exports = logger;