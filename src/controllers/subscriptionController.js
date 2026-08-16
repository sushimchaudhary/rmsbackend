

// const { prisma } = require("../config/dbConnect");
// const {
//   VALID_PLAN_TYPES,
//   calculateEndDate,
//   getBranchSubscriptionStatus,
//   ensureDefaultPlans,
// } = require("../utils/subscriptionUtils");

// exports.getSubscriptionPlans = async (req, res) => {
//   try {
//     const plans = await prisma.subscriptionPlan.findMany({
//       where: { is_active: true },
//       orderBy: [{ type: "asc" }, { price: "asc" }],
//     });
//     res.status(200).json({ success: true, plans });
//   } catch (error) {
//     res.status(500).json({ response: "Error fetching plans." });
//   }
// };

// exports.createSubscriptionPlan = async (req, res) => {
//   try {
//     const { name, type, price, duration_days } = req.body;

//     if (!name || !type || duration_days == null) {
//       return res.status(400).json({ response: "name, type, and duration_days are required." });
//     }

//     if (!VALID_PLAN_TYPES.includes(type)) {
//       return res.status(400).json({
//         response: `Invalid type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`,
//       });
//     }

//     const plan = await prisma.subscriptionPlan.create({
//       data: {
//         name: name.trim(),
//         type,
//         price: price ?? 0,
//         duration_days: Number(duration_days),
//       },
//     });

//     res.status(201).json({ success: true, plan });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ response: "Failed to create subscription plan." });
//   }
// };

// exports.updateSubscriptionPlan = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, price, duration_days, is_active } = req.body;

//     const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
//     if (!existing) return res.status(404).json({ response: "Plan not found." });

//     const plan = await prisma.subscriptionPlan.update({
//       where: { id },
//       data: {
//         ...(name != null && { name: name.trim() }),
//         ...(price != null && { price }),
//         ...(duration_days != null && { duration_days: Number(duration_days) }),
//         ...(is_active != null && { is_active }),
//       },
//     });

//     res.status(200).json({ success: true, plan });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ response: "Failed to update subscription plan." });
//   }
// };

// exports.getBranchSubscription = async (req, res) => {
//   try {
//     const { branch_id } = req.params;

//     const branch = await prisma.branch.findUnique({
//       where: { id: branch_id },
//       include: {
//         subscriptions: {
//           orderBy: { created_at: "desc" },
//           take: 1,
//           include: { plan: true },
//         },
//       },
//     });

//     if (!branch) return res.status(404).json({ response: "Branch not found." });

//     if (!req.user.super_user && branch.restaurant_id !== req.user.restaurant_id) {
//       return res.status(403).json({ response: "Access denied." });
//     }

//     const activeSub = branch.subscriptions[0];

//     res.status(200).json({
//       success: true,
//       branch_id: branch.id,
//       branch_name: branch.name,
//       subscription: getBranchSubscriptionStatus(branch, activeSub),
//       plan: activeSub?.plan || null,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ response: "Error fetching branch subscription." });
//   }
// };

// exports.assignBranchSubscription = async (req, res) => {
//   try {
//     let { branch_id, plan_type, plan_id } = req.body;

//     if (!branch_id) {
//       return res.status(400).json({ response: "branch_id is required." });
//     }

//     const branch = await prisma.branch.findUnique({ where: { id: branch_id } });
//     if (!branch) return res.status(404).json({ response: "Branch not found." });

//     // Verification check for normal Admin
//     if (!req.user.super_user && branch.restaurant_id !== req.user.restaurant_id) {
//       return res.status(403).json({ response: "Access denied." });
//     }

//     if (plan_type && !VALID_PLAN_TYPES.includes(plan_type)) {
//       return res.status(400).json({
//         response: `Invalid plan_type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`,
//       });
//     }

//     const result = await prisma.$transaction(async (tx) => {
//       let plan;
//       if (plan_id) {
//         plan = await tx.subscriptionPlan.findUnique({ where: { id: plan_id } });
//         if (!plan || !plan.is_active) throw new Error("Subscription plan not found or inactive.");
//       } else {
//         plan = await tx.subscriptionPlan.findFirst({
//           where: { type: plan_type || "monthly", is_active: true },
//         });
//         if (!plan) throw new Error(`No active plan found for type: ${plan_type || "monthly"}`);
//       }

//       const startDate = new Date();
//       const endDate = calculateEndDate(startDate, plan.duration_days);
//       const status = plan.type === "free_trial" ? "trial" : "active";

//       const subscription = await tx.restaurantSubscription.create({
//         data: {
//           restaurant_id: branch.restaurant_id,
//           branch_id: branch.id,
//           plan_id: plan.id,
//           status,
//           start_date: startDate,
//           end_date: endDate,
//         },
//         include: { plan: true },
//       });

//       return subscription;
//     });

//     res.status(200).json({
//       success: true,
//       message: "Subscription assigned successfully.",
//       subscription: result,
//       status: getBranchSubscriptionStatus(branch, result),
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ response: error.message || "Failed to assign subscription." });
//   }
// };

// /* =========================================================================
//    MANUAL / OFFLINE PAYMENT RECORDING ONLY.
//    ---------------------------------------------------------------------
//    This used to accept payment_method: "esewa" | "khalti" with a
//    client-supplied transaction_id and payment_details:{status:"SUCCESS"} —
//    meaning any authenticated user could call this endpoint directly and
//    activate a paid subscription without ever paying, since nothing here
//    verified the payment actually happened.

//    Real eSewa/Khalti purchases now go through the gateway-verified flow:
//      POST /api/subscriptions/initiate-esewa   -> subscriptionPaymentController
//      GET  /api/subscriptions/esewa-success    (eSewa calls this; HMAC verified)
//      POST /api/subscriptions/initiate-khalti
//      GET  /api/subscriptions/khalti-success   (verified via Khalti's lookup API)

//    This endpoint is now restricted to admin-recorded offline payments
//    (cash / bank transfer) only.
//    ========================================================================= */
// exports.verifyAndPurchaseSubscription = async (req, res) => {
//   try {
//     let {
//       restaurant_id,
//       branch_id,
//       plan_id,
//       transaction_id,
//       amount,
//       payment_method,
//       payment_details,
//     } = req.body;

//     if (req.user && !req.user.super_user) {
//       restaurant_id = req.user.restaurant_id;
//     }

//     const MANUAL_METHODS = ["cash", "bank_transfer"];
//     if (!MANUAL_METHODS.includes(payment_method)) {
//       return res.status(400).json({
//         response:
//           `payment_method must be one of: ${MANUAL_METHODS.join(", ")}. ` +
//           `eSewa/Khalti purchases must go through /subscriptions/initiate-esewa or /initiate-khalti ` +
//           `so the payment can be verified server-side before a subscription is activated.`,
//       });
//     }

//     const isAdmin = req.user?.super_user || req.user?.is_admin || req.user?.role === "admin";
//     if (!isAdmin) {
//       return res.status(403).json({ response: "Only an admin can record a manual payment." });
//     }

//     if (!restaurant_id || !branch_id) {
//       return res.status(400).json({ response: "Restaurant and Branch are required." });
//     }

//     if (!transaction_id || !String(transaction_id).trim()) {
//       return res.status(400).json({ response: "transaction_id is required (use a receipt/reference number)." });
//     }

//     const plan = await prisma.subscriptionPlan.findUnique({ where: { id: plan_id } });
//     if (!plan || !plan.is_active) {
//       return res.status(404).json({ response: "Plan not found." });
//     }

//     if (plan.type === "free_trial") {
//       return res.status(400).json({ response: "Free trial plans cannot be purchased." });
//     }

//     const startDate = new Date();
//     const endDate = calculateEndDate(startDate, plan.duration_days);

//     const result = await prisma.$transaction(async (tx) => {
//       const sub = await tx.restaurantSubscription.create({
//         data: {
//           restaurant_id,
//           branch_id,
//           plan_id,
//           status: "active",
//           start_date: startDate,
//           end_date: endDate,
//         },
//         include: { plan: true },
//       });

//       await tx.subscriptionPayment.create({
//         data: {
//           subscription_id: sub.id,
//           restaurant_id,
//           transaction_id,
//           amount,
//           payment_method,
//           status: "completed",
//           payment_details: {
//             ...(payment_details || {}),
//             recorded_by: req.user.id,
//             manual: true,
//           },
//         },
//       });

//       return sub;
//     });

//     res.status(200).json({
//       success: true,
//       message: "Manual subscription payment recorded and subscription activated.",
//       subscription: result,
//     });
//   } catch (error) {
//     console.error("PURCHASE SUBSCRIPTION ERROR:", error);

//     if (error.code === "P2002") {
//       return res.status(400).json({ response: "This transaction_id has already been recorded." });
//     }

//     res.status(500).json({ response: "Failed to activate subscription." });
//   }
// };

// exports.seedDefaultPlans = async (_req, res) => {
//   try {
//     await ensureDefaultPlans();
//     const plans = await prisma.subscriptionPlan.findMany({ where: { is_active: true } });
//     res.status(200).json({ success: true, message: "Default plans ensured.", plans });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ response: "Failed to seed default plans." });
//   }
// };

// exports.getAllSubscriptions = async (req, res) => {
//   try {
//     const subscriptions = await prisma.restaurantSubscription.findMany({
//       include: {
//         restaurant: { select: { id: true, name: true } },
//         branch: { select: { id: true, name: true } },
//         plan: true,
//       },
//       orderBy: { created_at: "desc" },
//     });
//     res.status(200).json({ success: true, subscriptions });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ response: "Failed to fetch subscriptions." });
//   }
// };

// exports.extendSubscription = async (req, res) => {
//   try {
//     const { subscription_id, days } = req.body;
//     if (!subscription_id || !days) {
//       return res.status(400).json({ response: "subscription_id and days are required." });
//     }

//     const sub = await prisma.restaurantSubscription.findUnique({ where: { id: subscription_id } });
//     if (!sub) return res.status(404).json({ response: "Subscription not found." });

//     // Extend from whichever is later: today or the current end date
//     const base = new Date(sub.end_date) > new Date() ? new Date(sub.end_date) : new Date();
//     base.setDate(base.getDate() + Number(days));

//     const updated = await prisma.restaurantSubscription.update({
//       where: { id: subscription_id },
//       data: { end_date: base, status: "active" },
//       include: { plan: true, restaurant: true },
//     });

//     res.status(200).json({
//       success: true,
//       message: `Extended by ${days} day(s).`,
//       subscription: updated,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ response: "Failed to extend subscription." });
//   }
// };

// exports.getPaymentHistory = async (req, res) => {
//   try {
//     const { restaurant_id } = req.params;

//     // SuperAdmin ले specific restaurant_id नपठाए पनि सबै देख्न सकोस्
//     let whereCondition = {};

//     if (restaurant_id && restaurant_id !== "all" && restaurant_id !== "undefined") {
//       if (!req.user.super_user && req.user.restaurant_id !== restaurant_id) {
//         return res.status(403).json({ response: "Access denied." });
//       }
//       whereCondition = { restaurant_id };
//     } else if (!req.user.super_user) {
//       // Normal admin ले आफ्नो restaurant को मात्र हेर्न पाउने
//       whereCondition = { restaurant_id: req.user.restaurant_id };
//     }

//     const payments = await prisma.subscriptionPayment.findMany({
//       where: whereCondition,
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


const crypto = require("crypto");
const axios = require("axios");
const { prisma } = require("../config/dbConnect");
const {
  VALID_PLAN_TYPES,
  calculateEndDate,
  getBranchSubscriptionStatus,
  ensureDefaultPlans,
} = require("../utils/subscriptionUtils");

// Credentials from environment variables
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY;
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE ;
const ESEWA_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY ;
const KHALTI_INITIATE_URL = "https://a.khalti.com/api/v2/epayment/initiate/";
const KHALTI_LOOKUP_URL = "https://a.khalti.com/api/v2/epayment/lookup/";

const FRONTEND_URL = process.env.FRONTEND_MENU_URL ;

// ==========================================
// 1. GET ALL PLANS
// ==========================================
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

// ==========================================
// 2. CREATE PLAN
// ==========================================
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

// ==========================================
// 3. UPDATE PLAN
// ==========================================
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

// ==========================================
// 4. GET BRANCH SUBSCRIPTION
// ==========================================
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

// ==========================================
// 5. ASSIGN FREE TRIAL / DIRECT ASSIGN
// ==========================================
exports.assignBranchSubscription = async (req, res) => {
  try {
    let { branch_id, plan_type, plan_id } = req.body;

    if (!branch_id) {
      return res.status(400).json({ response: "branch_id is required." });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branch_id } });
    if (!branch) return res.status(404).json({ response: "Branch not found." });

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

// ==========================================
// 6. INITIATE ESEWA SUBSCRIPTION
// ==========================================
exports.initiateEsewaSubscription = async (req, res) => {
  try {
    const { branch_id, plan_id } = req.body;

    if (!branch_id || !plan_id) {
      return res.status(400).json({ response: "branch_id and plan_id are required." });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: plan_id } });
    if (!plan || !plan.is_active) {
      return res.status(404).json({ response: "Plan not found or inactive." });
    }

    const total_amount = Number(plan.price).toFixed(2);
    // Unique Transaction UUID containing Branch and Plan IDs
    const transaction_uuid = `TXN-${Date.now()}-${branch_id.slice(-4)}-${plan_id.slice(-4)}`;

    const signatureString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
    const signature = crypto
      .createHmac("sha256", ESEWA_SECRET_KEY)
      .update(signatureString)
      .digest("base64");

    const formData = {
      amount: total_amount,
      tax_amount: "0",
      total_amount: total_amount,
      transaction_uuid: transaction_uuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${FRONTEND_URL}/cms/subscription/subscription-history?gateway=esewa&status=success`,
      failure_url: `${FRONTEND_URL}/cms/subscription/subscription-plans?gateway=esewa&status=failed`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    };

    return res.status(200).json({
      success: true,
      payment_url: ESEWA_URL,
      payment_data: formData,
    });
  } catch (error) {
    console.error("eSewa Initiation Error:", error);
    return res.status(500).json({ response: "Failed to initiate eSewa payment." });
  }
};

// ==========================================
// 7. INITIATE KHALTI SUBSCRIPTION
// ==========================================
exports.initiateKhaltiSubscription = async (req, res) => {
  try {
    const { branch_id, plan_id } = req.body;

    if (!branch_id || !plan_id) {
      return res.status(400).json({ response: "branch_id and plan_id are required." });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: plan_id } });
    if (!plan || !plan.is_active) {
      return res.status(404).json({ response: "Plan not found or inactive." });
    }

    const amountInPaisa = Math.round(Number(plan.price) * 100);
    const purchase_order_id = `TXN-KHALTI-${Date.now()}`;

    const payload = {
      return_url: `${FRONTEND_URL}/cms/subscription/subscription-history?gateway=khalti`,
      website_url: FRONTEND_URL,
      amount: amountInPaisa,
      purchase_order_id: purchase_order_id,
      purchase_order_name: plan.name,
      customer_info: {
        name: req.user?.username || "Restaurant Admin",
        email: req.user?.email || "admin@example.com",
      },
    };

    const response = await axios.post(KHALTI_INITIATE_URL, payload, {
      headers: {
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({
      success: true,
      payment_data: {
        payment_url: response.data.payment_url,
        pidx: response.data.pidx,
      },
    });
  } catch (error) {
    console.error("Khalti Initiation Error:", error.response?.data || error.message);
    return res.status(500).json({ response: "Failed to initiate Khalti payment." });
  }
};

// ==========================================
// 8. VERIFY & PURCHASE MANUAL SUBSCRIPTION
// ==========================================
exports.verifyAndPurchaseSubscription = async (req, res) => {
  try {
    let {
      restaurant_id,
      branch_id,
      plan_id,
      transaction_id,
      amount,
      payment_method,
      payment_details,
    } = req.body;

    if (req.user && !req.user.super_user) {
      restaurant_id = req.user.restaurant_id;
    }

    const MANUAL_METHODS = ["cash", "bank_transfer"];
    if (!MANUAL_METHODS.includes(payment_method)) {
      return res.status(400).json({
        response:
          `payment_method must be one of: ${MANUAL_METHODS.join(", ")}. ` +
          `eSewa/Khalti purchases must go through /subscriptions/initiate-esewa or /initiate-khalti`,
      });
    }

    const isAdmin = req.user?.super_user || req.user?.is_admin || req.user?.role === "admin";
    if (!isAdmin) {
      return res.status(403).json({ response: "Only an admin can record a manual payment." });
    }

    if (!restaurant_id || !branch_id) {
      return res.status(400).json({ response: "Restaurant and Branch are required." });
    }

    if (!transaction_id || !String(transaction_id).trim()) {
      return res.status(400).json({ response: "transaction_id is required." });
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

      await tx.subscriptionPayment.create({
        data: {
          subscription_id: sub.id,
          restaurant_id,
          transaction_id,
          amount,
          payment_method,
          status: "completed",
          payment_details: {
            ...(payment_details || {}),
            recorded_by: req.user.id,
            manual: true,
          },
        },
      });

      return sub;
    });

    res.status(200).json({
      success: true,
      message: "Manual subscription payment recorded and subscription activated.",
      subscription: result,
    });
  } catch (error) {
    console.error("PURCHASE SUBSCRIPTION ERROR:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ response: "This transaction_id has already been recorded." });
    }
    res.status(500).json({ response: "Failed to activate subscription." });
  }
};

// ==========================================
// 9. OTHER UTILITY & ADMIN ENDPOINTS
// ==========================================
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

exports.getPaymentHistory = async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    let whereCondition = {};

    if (restaurant_id && restaurant_id !== "all" && restaurant_id !== "undefined") {
      if (!req.user.super_user && req.user.restaurant_id !== restaurant_id) {
        return res.status(403).json({ response: "Access denied." });
      }
      whereCondition = { restaurant_id };
    } else if (!req.user.super_user) {
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