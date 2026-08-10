require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Connection String
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_LoXCfmQK4x1i@ep-small-rice-axul649g-pooler.c-4.us-east-2.aws.neon.tech/rms?sslmode=require";

// Standard PG Pool Setup
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Standard Prisma PG Adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL (Neon) connected successfully via PG Adapter!");

    const { ensureDefaultPlans } = require("../utils/subscriptionUtils");
    await ensureDefaultPlans();
    console.log("✅ Default subscription plans ensured.");
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { connectDB, prisma };