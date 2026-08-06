const { generateSalesInsights } = require('../services/aiService');
const { prisma } = require('../config/dbConnect');

const getDashboardAIInsight = async (req, res) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;

    // Database bata recent 20 ota sales/orders data line
    const recentOrders = await prisma.order.findMany({
      where: branchId ? { branch_id: branchId } : {},
      take: 20,
      orderBy: { created_at: 'desc' }, // 🟢 createdAt -> created_at
      select: {
        items: true,
        total_amount: true,            // 🟢 totalAmount -> total_amount
        created_at: true,              // 🟢 createdAt -> created_at
      },
    });

    // AI service ma data pathaune
    const insights = await generateSalesInsights(recentOrders);

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("AI Insight Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardAIInsight };