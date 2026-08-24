// const { prisma } = require("../config/dbConnect");

// const TRIAL_DURATION_DAYS = 30;
// const MONTHLY_DURATION_DAYS = 30;
// const YEARLY_DURATION_DAYS = 365;

// const DEFAULT_PLANS = [
//   {
//     name: "1-Month Free Trial",
//     type: "free_trial",
//     price: 0,
//     duration_days: TRIAL_DURATION_DAYS,
//   },
//   {
//     name: "Monthly Subscription",
//     type: "monthly",
//     price: 10000, // NPR 10,000 / month
//     duration_days: MONTHLY_DURATION_DAYS,
//   },
//   {
//     name: "Yearly Subscription",
//     type: "yearly",
//     price: 102000, // 15% discount (Original: 120,000 -> Discounted: 102,000)
//     duration_days: YEARLY_DURATION_DAYS,
//   },
// ];

// const VALID_PLAN_TYPES = ["free_trial", "monthly", "yearly"];
// const getOrCreatePlan = async (tx, planType) => {
//   const db = tx || prisma;
//   const type = planType || "free_trial";

//   if (!VALID_PLAN_TYPES.includes(type)) {
//     throw new Error(`Invalid plan type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`);
//   }

//   // is_active: true लाई optional वा create/update मा sync गराउने
//   let plan = await db.subscriptionPlan.findFirst({
//     where: { type },
//     orderBy: { created_at: "asc" },
//   });

//   if (!plan) {
//     const defaults = DEFAULT_PLANS.find((p) => p.type === type);
//     plan = await db.subscriptionPlan.create({
//       data: {
//         ...defaults,
//         is_active: true,
//       },
//     });
//   }

//   return plan;
// };

// const getPlanById = async (tx, planId) => {
//   const db = tx || prisma;
//   const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } });

//   if (!plan || !plan.is_active) {
//     throw new Error("Subscription plan not found or inactive.");
//   }

//   return plan;
// };

// const calculateEndDate = (startDate, durationDays) => {
//   const endDate = new Date(startDate);
//   endDate.setDate(endDate.getDate() + durationDays);
//   return endDate;
// };

// const createBranchSubscription = async (tx, { restaurant_id, branch_id, plan, assignedByAdmin = false }) => {
//   const startDate = new Date();
//   const endDate = calculateEndDate(startDate, plan.duration_days);

//   const isTrial = plan.type === "free_trial";
//   const status = isTrial ? "trial" : "active";

//   return tx.restaurantSubscription.create({
//     data: {
//       restaurant_id,
//       branch_id,
//       plan_id: plan.id,
//       status,
//       start_date: startDate,
//       end_date: endDate,
//     },
//     include: { plan: true },
//   });
// };

// const resolvePlanForBranch = async (tx, { plan_type, plan_id }) => {
//   if (plan_id) {
//     return getPlanById(tx, plan_id);
//   }
//   return getOrCreatePlan(tx, plan_type || "free_trial");
// };

// const getBranchSubscriptionStatus = (branch, subscription) => {
//   const currentDate = new Date();

//   let expiryDate;
//   if (subscription) {
//     expiryDate = new Date(subscription.end_date);
//   } else {
//     expiryDate = new Date(branch.createdAt);
//     expiryDate.setDate(expiryDate.getDate() + TRIAL_DURATION_DAYS);
//   }

//   const isExpired = currentDate > expiryDate;
//   const diffTime = expiryDate - currentDate;
//   const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

//   return {
//     status: isExpired ? "expired" : subscription?.status || "trial",
//     plan_type: subscription?.plan?.type || "free_trial",
//     plan_name: subscription?.plan?.name || "1-Month Free Trial",
//     is_expired: isExpired,
//     days_left: daysLeft,
//     expiry_date: expiryDate,
//     start_date: subscription?.start_date || branch.createdAt,
//   };
// };

// const ensureDefaultPlans = async () => {
//   for (const planData of DEFAULT_PLANS) {
//     const existing = await prisma.subscriptionPlan.findFirst({
//       where: { type: planData.type },
//     });

//     if (!existing) {
//       await prisma.subscriptionPlan.create({ data: planData });
//     } else {
//       // डेटाबेसमा पहिले नै सेभ भएका प्लानहरूको नाम र मूल्य पनि अपडेट गर्छ
//       await prisma.subscriptionPlan.update({
//         where: { id: existing.id },
//         data: {
//           name: planData.name,
//           price: planData.price,
//           duration_days: planData.duration_days,
//         },
//       });
//     }
//   }
// };

// module.exports = {
//   TRIAL_DURATION_DAYS,
//   MONTHLY_DURATION_DAYS,
//   YEARLY_DURATION_DAYS,
//   DEFAULT_PLANS,
//   VALID_PLAN_TYPES,
//   getOrCreatePlan,
//   getPlanById,
//   calculateEndDate,
//   createBranchSubscription,
//   resolvePlanForBranch,
//   getBranchSubscriptionStatus,
//   ensureDefaultPlans,
// };

const { prisma } = require("../config/dbConnect");

// const TRIAL_DURATION_DAYS = 2;
const TRIAL_DURATION_DAYS = 30;
const MONTHLY_DURATION_DAYS = 30;
const YEARLY_DURATION_DAYS = 365;

const DEFAULT_PLANS = [
  {
    name: "1-Month Free Trial",
    type: "free_trial",
    price: 0,
    duration_days: TRIAL_DURATION_DAYS,
  },
  {
    name: "Monthly Subscription",
    type: "monthly",
    price: 10000, // NPR 10,000 / month
    duration_days: MONTHLY_DURATION_DAYS,
  },
  {
    name: "Yearly Subscription",
    type: "yearly",
    price: 102000, // 15% discount (Original: 120,000 -> Discounted: 102,000)
    duration_days: YEARLY_DURATION_DAYS,
  },
];

const VALID_PLAN_TYPES = ["free_trial", "monthly", "yearly"];

const getOrCreatePlan = async (tx, planType) => {
  const db = tx || prisma;
  const type = planType || "free_trial";

  if (!VALID_PLAN_TYPES.includes(type)) {
    throw new Error(`Invalid plan type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`);
  }

  let plan = await db.subscriptionPlan.findFirst({
    where: { type },
    orderBy: { created_at: "asc" },
  });

  if (!plan) {
    const defaults = DEFAULT_PLANS.find((p) => p.type === type);
    plan = await db.subscriptionPlan.create({
      data: {
        ...defaults,
        is_active: true,
      },
    });
  }

  return plan;
};

const getPlanById = async (tx, planId) => {
  const db = tx || prisma;
  const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } });

  if (!plan || !plan.is_active) {
    throw new Error("Subscription plan not found or inactive.");
  }

  return plan;
};

const calculateEndDate = (startDate, durationDays) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
};

// 🛑 UPDATE: Single Free Trial Check added here
const createBranchSubscription = async (tx, { restaurant_id, branch_id, plan, assignedByAdmin = false }) => {
  const db = tx || prisma;

  // यदि Assignment को Plan 'free_trial' हो भने database मा जाँच्ने
  if (plan.type === "free_trial") {
    const existingTrial = await db.restaurantSubscription.findFirst({
      where: {
        branch_id: branch_id,
        plan: {
          type: "free_trial",
        },
      },
    });

    if (existingTrial) {
      throw new Error("This branch has already claimed a free trial. Please select a paid plan.");
    }
  }

  const startDate = new Date();
  const endDate = calculateEndDate(startDate, plan.duration_days);

  const isTrial = plan.type === "free_trial";
  const status = isTrial ? "trial" : "active";

  return db.restaurantSubscription.create({
    data: {
      restaurant_id,
      branch_id,
      plan_id: plan.id,
      status,
      start_date: startDate,
      end_date: endDate,
    },
    include: { plan: true },
  });
};

const resolvePlanForBranch = async (tx, { plan_type, plan_id }) => {
  if (plan_id) {
    return getPlanById(tx, plan_id);
  }
  return getOrCreatePlan(tx, plan_type || "free_trial");
};

const getBranchSubscriptionStatus = (branch, subscription) => {
  const currentDate = new Date();

  let expiryDate;
  if (subscription) {
    expiryDate = new Date(subscription.end_date);
  } else {
    expiryDate = new Date(branch.createdAt);
    expiryDate.setDate(expiryDate.getDate() + TRIAL_DURATION_DAYS);
  }

  const isExpired = currentDate > expiryDate;
  const diffTime = expiryDate - currentDate;
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    status: isExpired ? "expired" : subscription?.status || "trial",
    plan_type: subscription?.plan?.type || "free_trial",
    plan_name: subscription?.plan?.name || "1-Month Free Trial",
    is_expired: isExpired,
    days_left: daysLeft,
    expiry_date: expiryDate,
    start_date: subscription?.start_date || branch.createdAt,
  };
};

const ensureDefaultPlans = async () => {
  for (const planData of DEFAULT_PLANS) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { type: planData.type },
    });

    if (!existing) {
      await prisma.subscriptionPlan.create({ data: planData });
    } else {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: {
          name: planData.name,
          price: planData.price,
          duration_days: planData.duration_days,
        },
      });
    }
  }
};

module.exports = {
  TRIAL_DURATION_DAYS,
  MONTHLY_DURATION_DAYS,
  YEARLY_DURATION_DAYS,
  DEFAULT_PLANS,
  VALID_PLAN_TYPES,
  getOrCreatePlan,
  getPlanById,
  calculateEndDate,
  createBranchSubscription,
  resolvePlanForBranch,
  getBranchSubscriptionStatus,
  ensureDefaultPlans,
};