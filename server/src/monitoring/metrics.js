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

module.exports = {
  client,
  register,
  httpRequestCounter,
};