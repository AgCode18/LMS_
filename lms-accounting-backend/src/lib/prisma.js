import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

export default prisma;


//  typescript code  👇👇




// import "dotenv/config";
// import { PrismaMariaDb } from "@prisma/adapter-mariadb";
// import { PrismaClient } from "../generated/prisma/client.js";

// const adapter = new PrismaMariaDb({
//   host: process.env.DATABASE_HOST as string,
//   user: process.env.DATABASE_USER as string,
//   password: process.env.DATABASE_PASSWORD as string,
//   database: process.env.DATABASE_NAME as string,
//   connectionLimit: 5,
// });

// const prisma = new PrismaClient({ adapter });

// export default prisma;