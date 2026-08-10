require("dotenv").config();
const { prisma, connectDB } = require("../src/config/dbConnect");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function createSuperUser() {
  console.log("🚀 Starting Super User creation...");

  try {
    await connectDB();

    console.log("🔎 Checking if Super User exists...");
    const exists = await prisma.user.findFirst({
      where: { super_user: true },
    });

    if (exists) {
      console.log("⚠️ Super user already exists in Neon database!");
      return;
    }

    console.log("⏳ Hashing password...");
    const plainPassword = "Sushim@1234";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    console.log("📝 Creating super user in Neon Database...");
    const superUser = await prisma.user.create({
      data: {
        username: "sushim",
        password: hashedPassword,
        email: "sushimchaudhary1@gmail.com",
        role: "super_admin",
        super_user: true,
        is_admin: false,
        is_staff: false,
      },
    });

    const token = jwt.sign(
      { userId: superUser.id, role: superUser.role },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "30d" },
    );

    console.log("🎉 SUCCESS! Super user created successfully!");
    console.log("👤 Username:", superUser.username);
    console.log("🔑 Token:", token);
  } catch (err) {
    console.error("❌ ERROR creating super user:", err);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from DB.");
  }
}

createSuperUser();
