// import { PrismaClient } from "@prisma/client";

// // Singleton pattern — reuse the same Prisma instance
// const prisma = new PrismaClient({
//   log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
// });

// export default prisma;

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();
export default prisma