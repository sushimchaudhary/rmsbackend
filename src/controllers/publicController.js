const { prisma } = require("../config/dbConnect");

/* ===================== GET PUBLIC STATS ===================== */
exports.getPublicStats = async (req, res) => {
  try {
    const [restaurantCount, branchCount, plans] = await Promise.all([
      prisma.restaurant.count(),
      prisma.branch.count(),
      prisma.subscriptionPlan.findMany({
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          duration_days: true,
        },
        orderBy: [{ type: "asc" }, { price: "asc" }],
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        restaurants: restaurantCount,
        branches: branchCount,
        plans,
      },
    });
  } catch (err) {
    console.error("PUBLIC STATS ERROR:", err);
    res.status(500).json({ response: "Server error fetching public stats" });
  }
};