const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

// Count total HTTP requests
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Measure request duration
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Active HTTP requests
const activeRequests = new client.Gauge({
  name: "active_http_requests",
  help: "Number of active HTTP requests",
  registers: [register],
});

module.exports = {
  client,
  register,
  httpRequestCounter,
  httpRequestDuration,
  activeRequests,
};