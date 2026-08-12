// scripts/updateBranchCodes.js
const { prisma } = require("../src/config/dbConnect");

async function migrateBranchCodes() {
  try {
    console.log("Starting branch_code migration for existing data...");

    // 1. सबै Restaurants तान्ने
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true },
    });

    for (const restaurant of restaurants) {
      // 2. उक्त Restaurant का सबै Branches ल्याउने (सुरुमा बनेको आधारमा Sorting)
      const branches = await prisma.branch.findMany({
        where: { restaurant_id: restaurant.id },
        orderBy: { createdAt: "asc" },
      });

      let codeCounter = 1;

      for (const branch of branches) {
        // यदि पहिले नै branch_code छ भने counter बढाउने र नभए अपडेट गर्ने
        if (!branch.branch_code) {
          const generatedCode = `BR-${String(codeCounter).padStart(2, "0")}`;

          await prisma.branch.update({
            where: { id: branch.id },
            data: { branch_code: generatedCode },
          });

          console.log(`Updated Branch '${branch.name}' -> ${generatedCode}`);
        }
        codeCounter++;
      }
    }

    console.log("✅ Branch Code Migration Completed Successfully!");
  } catch (error) {
    console.error("❌ Migration Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBranchCodes();