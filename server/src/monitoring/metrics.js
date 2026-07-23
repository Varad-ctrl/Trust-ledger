const client = require("prom-client");

// Create a registry
const register = new client.Registry();

// Collect default Node.js metrics
client.collectDefaultMetrics({
  register,
});

module.exports = {
  client,
  register,
};