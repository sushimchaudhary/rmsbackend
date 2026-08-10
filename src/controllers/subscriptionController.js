const { prisma } = require("../config/dbConnect");
const {
  VALID_PLAN_TYPES,
  calculateEndDate,
  getBranchSubscriptionStatus,
  ensureDefaultPlans,
} = require("../utils/subscriptionUtils");

exports.getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { is_active: true },
      orderBy: [{ type: "asc" }, { price: "asc" }],
    });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ response: "Error fetching plans." });
  }
};

exports.createSubscriptionPlan = async (req, res) => {
  try {
    const { name, type, price, duration_days } = req.body;

    if (!name || !type || duration_days == null) {
      return res.status(400).json({ response: "name, type, and duration_days are required." });
    }

    if (!VALID_PLAN_TYPES.includes(type)) {
      return res.status(400).json({
        response: `Invalid type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`,
      });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        type,
        price: price ?? 0,
        duration_days: Number(duration_days),
      },
    });

    res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Failed to create subscription plan." });
  }
};

exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration_days, is_active } = req.body;

    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ response: "Plan not found." });

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name != null && { name: name.trim() }),
        ...(price != null && { price }),
        ...(duration_days != null && { duration_days: Number(duration_days) }),
        ...(is_active != null && { is_active }),
      },
    });

    res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Failed to update subscription plan." });
  }
};

exports.getBranchSubscription = async (req, res) => {
  try {
    const { branch_id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: branch_id },
      include: {
        subscriptions: {
          orderBy: { created_at: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!branch) return res.status(404).json({ response: "Branch not found." });

    if (!req.user.super_user && branch.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ response: "Access denied." });
    }

    const activeSub = branch.subscriptions[0];

    res.status(200).json({
      success: true,
      branch_id: branch.id,
      branch_name: branch.name,
      subscription: getBranchSubscriptionStatus(branch, activeSub),
      plan: activeSub?.plan || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Error fetching branch subscription." });
  }
};

exports.assignBranchSubscription = async (req, res) => {
  try {
    let { branch_id, plan_type, plan_id } = req.body;

    if (!branch_id) {
      return res.status(400).json({ response: "branch_id is required." });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branch_id } });
    if (!branch) return res.status(404).json({ response: "Branch not found." });

    // Verification check for normal Admin
    if (!req.user.super_user && branch.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ response: "Access denied." });
    }

    if (plan_type && !VALID_PLAN_TYPES.includes(plan_type)) {
      return res.status(400).json({
        response: `Invalid plan_type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let plan;
      if (plan_id) {
        plan = await tx.subscriptionPlan.findUnique({ where: { id: plan_id } });
        if (!plan || !plan.is_active) throw new Error("Subscription plan not found or inactive.");
      } else {
        plan = await tx.subscriptionPlan.findFirst({
          where: { type: plan_type || "monthly", is_active: true },
        });
        if (!plan) throw new Error(`No active plan found for type: ${plan_type || "monthly"}`);
      }

      const startDate = new Date();
      const endDate = calculateEndDate(startDate, plan.duration_days);
      const status = plan.type === "free_trial" ? "trial" : "active";

      const subscription = await tx.restaurantSubscription.create({
        data: {
          restaurant_id: branch.restaurant_id,
          branch_id: branch.id,
          plan_id: plan.id,
          status,
          start_date: startDate,
          end_date: endDate,
        },
        include: { plan: true },
      });

      return subscription;
    });

    res.status(200).json({
      success: true,
      message: "Subscription assigned successfully.",
      subscription: result,
      status: getBranchSubscriptionStatus(branch, result),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: error.message || "Failed to assign subscription." });
  }
};

exports.verifyAndPurchaseSubscription = async (req, res) => {
  try {
    let {
      restaurant_id,
      branch_id, // Selected branch ID from frontend
      plan_id,
      transaction_id,
      amount,
      payment_method,
      payment_details,
    } = req.body;

    // Admin user भएमा autocompletion
    if (req.user && !req.user.super_user) {
      restaurant_id = req.user.restaurant_id;
    }

    if (!restaurant_id || !branch_id) {
      return res.status(400).json({ response: "Restaurant and Branch are required." });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: plan_id } });
    if (!plan || !plan.is_active) {
      return res.status(404).json({ response: "Plan not found." });
    }

    if (plan.type === "free_trial") {
      return res.status(400).json({ response: "Free trial plans cannot be purchased." });
    }

    const startDate = new Date();
    const endDate = calculateEndDate(startDate, plan.duration_days);

    const result = await prisma.$transaction(async (tx) => {
      // Create new active subscription record tied to the selected branch
      const sub = await tx.restaurantSubscription.create({
        data: {
          restaurant_id,
          branch_id,
          plan_id,
          status: "active",
          start_date: startDate,
          end_date: endDate,
        },
        include: { plan: true },
      });

      // Record payment transaction
      await tx.subscriptionPayment.create({
        data: {
          subscription_id: sub.id,
          restaurant_id,
          transaction_id,
          amount,
          payment_method,
          status: "completed",
          payment_details,
        },
      });

      return sub;
    });

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully!",
      subscription: result,
    });
  } catch (error) {
    console.error("PURCHASE SUBSCRIPTION ERROR:", error);
    res.status(500).json({ response: "Failed to activate subscription." });
  }
};
exports.seedDefaultPlans = async (_req, res) => {
  try {
    await ensureDefaultPlans();
    const plans = await prisma.subscriptionPlan.findMany({ where: { is_active: true } });
    res.status(200).json({ success: true, message: "Default plans ensured.", plans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Failed to seed default plans." });
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.restaurantSubscription.findMany({
      include: {
        restaurant: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        plan: true,
      },
      orderBy: { created_at: "desc" },
    });
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Failed to fetch subscriptions." });
  }
};

exports.extendSubscription = async (req, res) => {
  try {
    const { subscription_id, days } = req.body;
    if (!subscription_id || !days) {
      return res.status(400).json({ response: "subscription_id and days are required." });
    }

    const sub = await prisma.restaurantSubscription.findUnique({ where: { id: subscription_id } });
    if (!sub) return res.status(404).json({ response: "Subscription not found." });

    // Extend from whichever is later: today or the current end date
    const base = new Date(sub.end_date) > new Date() ? new Date(sub.end_date) : new Date();
    base.setDate(base.getDate() + Number(days));

    const updated = await prisma.restaurantSubscription.update({
      where: { id: subscription_id },
      data: { end_date: base, status: "active" },
      include: { plan: true, restaurant: true },
    });

    res.status(200).json({
      success: true,
      message: `Extended by ${days} day(s).`,
      subscription: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Failed to extend subscription." });
  }
};

// exports.getPaymentHistory = async (req, res) => {
//   try {
//     const { restaurant_id } = req.params;

//     if (!req.user.super_user && req.user.restaurant_id !== restaurant_id) {
//       return res.status(403).json({ response: "Access denied." });
//     }

//     const payments = await prisma.subscriptionPayment.findMany({
//       where: { restaurant_id },
//       include: {
//         subscription: {
//           include: {
//             branch: { select: { id: true, name: true } },
//             plan: { select: { name: true, type: true } },
//           },
//         },
//       },
//       orderBy: { created_at: "desc" },
//     });

//     res.status(200).json({ success: true, payments });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ response: "Failed to fetch payment history." });
//   }
// };


exports.getPaymentHistory = async (req, res) => {
  try {
    const { restaurant_id } = req.params;

    // SuperAdmin ले specific restaurant_id नपठाए पनि सबै देख्न सकोस्
    let whereCondition = {};

    if (restaurant_id && restaurant_id !== "all" && restaurant_id !== "undefined") {
      if (!req.user.super_user && req.user.restaurant_id !== restaurant_id) {
        return res.status(403).json({ response: "Access denied." });
      }
      whereCondition = { restaurant_id };
    } else if (!req.user.super_user) {
      // Normal admin ले आफ्नो restaurant को मात्र हेर्न पाउने
      whereCondition = { restaurant_id: req.user.restaurant_id };
    }

    const payments = await prisma.subscriptionPayment.findMany({
      where: whereCondition,
      include: {
        subscription: {
          include: {
            branch: { select: { id: true, name: true } },
            plan: { select: { name: true, type: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Failed to fetch payment history." });
  }
};