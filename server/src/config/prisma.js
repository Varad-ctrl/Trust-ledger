const { PrismaClient } = require("@prisma/client");
const { dbQueryCounter } = require("../monitoring/metrics");

const prismaBase =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, query, args }) {
        try {
          const result = await query(args);

          dbQueryCounter.inc({
            operation,
            status: "success",
          });

          return result;
        } catch (err) {
          dbQueryCounter.inc({
            operation,
            status: "failed",
          });

          throw err;
        }
      },
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

module.exports = prisma;