const { prisma } = require("../config/dbConnect");
const { TRIAL_DURATION_DAYS } = require("../utils/subscriptionUtils");

const checkSubscriptionStatus = async (req, res, next) => {
  try {
    if (req.user?.superUser || req.user?.super_user) {
      return next();
    }

    const branchId =
      req.user?.branch_id ||
      req.user?.branch ||
      req.headers["x-branch-id"] ||
      req.params.branch_id ||
      req.query.branch_id;

    if (!branchId) return next();

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        subscriptions: {
          orderBy: { created_at: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!branch) {
      return res.status(404).json({ response: "Branch not found." });
    }

    const activeSubscription = branch.subscriptions[0];
    const currentDate = new Date();

    if (!activeSubscription) {
      const trialEndDate = new Date(branch.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);

      if (currentDate <= trialEndDate) return next();

      return res.status(402).json({
        success: false,
        is_expired: true,
        error_code: "SUBSCRIPTION_EXPIRED",
        response: `1-Month Free trial for '${branch.name}' has expired. Please subscribe to a plan.`,
      });
    }

    if (activeSubscription.status === "active" || activeSubscription.status === "trial") {
      if (currentDate <= new Date(activeSubscription.end_date)) {
        return next();
      }
    }

    const planLabel =
      activeSubscription.plan?.type === "free_trial"
        ? "Free trial"
        : activeSubscription.plan?.name || "Subscription";

    return res.status(402).json({
      success: false,
      is_expired: true,
      error_code: "SUBSCRIPTION_EXPIRED",
      response: `${planLabel} for '${branch.name}' branch has expired on ${new Date(activeSubscription.end_date).toLocaleDateString()}. Please renew your plan.`,
    });
  } catch (err) {
    console.error("SUBSCRIPTION CHECK ERROR:", err);
    res.status(500).json({ response: "Server error checking subscription." });
  }
};

module.exports = { checkSubscriptionStatus };
