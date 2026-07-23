const {
    httpRequestCounter,
    httpRequestDuration,
    activeRequests,
} = require("../monitoring/metrics");

module.exports = (req, res, next) => {
    // Increase active requests
    activeRequests.inc();

    const end = httpRequestDuration.startTimer();

    res.on("finish", () => {
        const labels = {
            method: req.method,
            route: req.route?.path || req.path,
            status_code: res.statusCode,
        };

        httpRequestCounter.inc(labels);

        end(labels);

        // Decrease active requests
        activeRequests.dec();
    });

    next();
};