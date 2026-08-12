
// const { prisma } = require("../config/dbConnect");
// const {
//   VALID_PLAN_TYPES,
//   resolvePlanForBranch,
//   createBranchSubscription,
//   getBranchSubscriptionStatus,
// } = require("../utils/subscriptionUtils");

// /* ===================== CREATE BRANCH ===================== */
// exports.createBranch = async (req, res) => {
//   try {
//     let { name, address, mobile_number, restaurant_id, plan_type, plan_id } = req.body;

//     // SuperAdmin नभएको खण्डमा आफ्नै restaurant_id Enforce गर्ने
//     if (!req.user.super_user) {
//       restaurant_id = req.user.restaurant_id;
//     }

//     if (!name || !address || !mobile_number || !restaurant_id) {
//       return res.status(400).json({ response: "All fields including restaurant_id are required" });
//     }

//     if (!/^[0-9]{10}$/.test(mobile_number)) {
//       return res.status(400).json({ response: "Mobile number must be exactly 10 digits" });
//     }

//     // Check if restaurant exists
//     const restaurantExists = await prisma.restaurant.findUnique({
//       where: { id: restaurant_id },
//     });
//     if (!restaurantExists) {
//       return res.status(404).json({ response: "Restaurant not found" });
//     }

//     // Duplicate check within same restaurant
//     const duplicate = await prisma.branch.findFirst({
//       where: {
//         name: name.trim(),
//         restaurant_id: restaurant_id,
//       },
//     });
//     if (duplicate) {
//       return res.status(400).json({
//         response: "Branch with same name already exists for this restaurant",
//       });
//     }

//     if (plan_type && !VALID_PLAN_TYPES.includes(plan_type)) {
//       return res.status(400).json({
//         response: `Invalid plan_type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`,
//       });
//     }

//     const result = await prisma.$transaction(async (tx) => {
//       const branch = await tx.branch.create({
//         data: {
//           name: name.trim(),
//           address: address.trim(),
//           mobile_number,
//           restaurant_id,
//         },
//       });

//       const plan = await resolvePlanForBranch(tx, { plan_type, plan_id });
//       const subscription = await createBranchSubscription(tx, {
//         restaurant_id,
//         branch_id: branch.id,
//         plan,
//         assignedByAdmin: true,
//       });

//       return { branch, subscription };
//     });

//     res.status(201).json({
//       data: result.branch,
//       subscription: getBranchSubscriptionStatus(result.branch, result.subscription),
//     });
//   } catch (err) {
//     console.error("CREATE BRANCH ERROR:", err);
//     res.status(500).json({ response: err.message || "Server error" });
//   }
// };

// /* ===================== GET ALL BRANCHES ===================== */
// exports.getBranches = async (req, res) => {
//   try {
//     const whereCondition = {};

//     // Filter by restaurant if user is not SuperAdmin
//     if (!req.user.super_user) {
//       whereCondition.restaurant_id = req.user.restaurant_id;
//     }

//     const branches = await prisma.branch.findMany({
//       where: whereCondition,
//       include: {
//         restaurant: {
//           select: { name: true },
//         },
//         subscriptions: {
//           orderBy: { created_at: "desc" },
//           take: 1,
//           include: { plan: true },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     const formatted = branches.map((b) => {
//       const activeSub = b.subscriptions?.[0];

//       return {
//         _id: b.id,
//         id: b.id,
//         name: b.name,
//         address: b.address,
//         mobile_number: b.mobile_number,
//         restaurant_id: b.restaurant_id,
//         restaurant_name: b.restaurant?.name || "-",
//         created_at: b.createdAt,
//         subscription: getBranchSubscriptionStatus(b, activeSub),
//       };
//     });

//     res.json({ data: formatted });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };

// /* ===================== UPDATE BRANCH ===================== */
// exports.updateBranch = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, address, mobile_number, restaurant_id } = req.body;

//     if (mobile_number && !/^[0-9]{10}$/.test(mobile_number)) {
//       return res.status(400).json({ response: "Mobile number must be exactly 10 digits" });
//     }

//     const branch = await prisma.branch.findUnique({ where: { id } });
//     if (!branch) return res.status(404).json({ response: "Branch not found" });

//     // Unauthorized access prevention
//     if (!req.user.super_user && branch.restaurant_id !== req.user.restaurant_id) {
//       return res.status(403).json({ response: "Access denied to update this branch" });
//     }

//     const targetRestaurantId = req.user.super_user
//       ? restaurant_id || branch.restaurant_id
//       : req.user.restaurant_id;

//     if (name) {
//       const duplicate = await prisma.branch.findFirst({
//         where: {
//           NOT: { id },
//           name: name.trim(),
//           restaurant_id: targetRestaurantId,
//         },
//       });
//       if (duplicate) {
//         return res.status(400).json({
//           response: "Branch with same name already exists for this restaurant",
//         });
//       }
//     }

//     const updatedBranch = await prisma.branch.update({
//       where: { id },
//       data: {
//         name: name ? name.trim() : branch.name,
//         address: address ? address.trim() : branch.address,
//         mobile_number: mobile_number || branch.mobile_number,
//         restaurant_id: targetRestaurantId,
//       },
//     });

//     res.json({ data: updatedBranch });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };

// /* ===================== DELETE BRANCH ===================== */
// exports.deleteBranch = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const branchExists = await prisma.branch.findUnique({ where: { id } });
//     if (!branchExists) return res.status(404).json({ response: "Branch not found" });

//     if (!req.user.super_user && branchExists.restaurant_id !== req.user.restaurant_id) {
//       return res.status(403).json({ response: "Access denied to delete this branch" });
//     }

//     await prisma.branch.delete({ where: { id } });

//     res.json({ response: "Branch deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };


const { prisma } = require("../config/dbConnect");
const {
  VALID_PLAN_TYPES,
  resolvePlanForBranch,
  createBranchSubscription,
  getBranchSubscriptionStatus,
} = require("../utils/subscriptionUtils");

/* ===================== CREATE BRANCH ===================== */
/* ===================== CREATE BRANCH ===================== */
exports.createBranch = async (req, res) => {
  try {
    let { name, address, mobile_number, restaurant_id, plan_type, plan_id, branch_code } = req.body;

    if (!req.user.super_user) {
      restaurant_id = req.user.restaurant_id;
    }

    if (!name || !address || !mobile_number || !restaurant_id) {
      return res.status(400).json({ response: "All fields including restaurant_id are required" });
    }

    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({ response: "Mobile number must be exactly 10 digits" });
    }

    const restaurantExists = await prisma.restaurant.findUnique({
      where: { id: restaurant_id },
    });
    if (!restaurantExists) {
      return res.status(404).json({ response: "Restaurant not found" });
    }

    // Duplicate Name Check
    const duplicateName = await prisma.branch.findFirst({
      where: {
        name: name.trim(),
        restaurant_id: restaurant_id,
      },
    });
    if (duplicateName) {
      return res.status(400).json({
        response: "Branch with same name already exists for this restaurant",
      });
    }

    if (plan_type && !VALID_PLAN_TYPES.includes(plan_type)) {
      return res.status(400).json({
        response: `Invalid plan_type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`,
      });
    }

    // Transaction भित्र नै Auto Generation र Creation गर्ने
    const result = await prisma.$transaction(async (tx) => {
      let finalBranchCode = branch_code ? branch_code.trim().toUpperCase() : null;

      if (!finalBranchCode) {
        // 1. यो Restaurant का सबै ब्रान्चहरू तान्ने (जाँचको लागि)
        const allBranches = await tx.branch.findMany({
          where: { restaurant_id },
          select: { branch_code: true },
        });

        let maxNum = 0;
        allBranches.forEach((b) => {
          if (b.branch_code) {
            // "BR-01", "BR-1", "br-02" आदिबाट अंक मात्र निकाल्ने Regex
            const match = b.branch_code.match(/\d+/);
            if (match) {
              const num = parseInt(match[0], 10);
              if (num > maxNum) maxNum = num;
            }
          }
        });

        // Max Number मा +1 गरेर नयाँ Code बनाउने (BR-01, BR-02, BR-03...)
        const nextNum = String(maxNum + 1).padStart(2, "0");
        finalBranchCode = `BR-${nextNum}`;
      } else {
        // Manual Code पठाएको भए Duplicate Check गर्ने
        const duplicateCode = await tx.branch.findFirst({
          where: {
            branch_code: finalBranchCode,
            restaurant_id: restaurant_id,
          },
        });

        if (duplicateCode) {
          throw new Error(`Branch code '${finalBranchCode}' already exists for this restaurant`);
        }
      }

      // Branch Create गर्ने
      const branch = await tx.branch.create({
        data: {
          name: name.trim(),
          address: address.trim(),
          mobile_number,
          restaurant_id,
          branch_code: finalBranchCode,
        },
      });

      const plan = await resolvePlanForBranch(tx, { plan_type, plan_id });
      const subscription = await createBranchSubscription(tx, {
        restaurant_id,
        branch_id: branch.id,
        plan,
        assignedByAdmin: true,
      });

      return { branch, subscription };
    });

    res.status(201).json({
      data: result.branch,
      subscription: getBranchSubscriptionStatus(result.branch, result.subscription),
    });
  } catch (err) {
    console.error("CREATE BRANCH ERROR:", err);
    res.status(400).json({ response: err.message || "Server error" });
  }
};

/* ===================== GET ALL BRANCHES ===================== */
exports.getBranches = async (req, res) => {
  try {
    const whereCondition = {};

    if (!req.user.super_user) {
      whereCondition.restaurant_id = req.user.restaurant_id;
    }

    const branches = await prisma.branch.findMany({
      where: whereCondition,
      include: {
        restaurant: {
          select: { name: true },
        },
        subscriptions: {
          orderBy: { created_at: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = branches.map((b) => {
      const activeSub = b.subscriptions?.[0];

      return {
        _id: b.id,
        id: b.id,
        name: b.name,
        branch_code: b.branch_code || "N/A", // 👈 Fallback मा "BR-01" को सट्टा "N/A" राख्नुहोस्
        address: b.address,
        mobile_number: b.mobile_number,
        restaurant_id: b.restaurant_id,
        restaurant_name: b.restaurant?.name || "-",
        created_at: b.createdAt,
        subscription: getBranchSubscriptionStatus(b, activeSub),
      };
    });

    res.json({ data: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "Server error" });
  }
};

/* ===================== UPDATE BRANCH ===================== */
/* ===================== UPDATE BRANCH ===================== */
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, address, mobile_number, restaurant_id, branch_code } = req.body;

    if (mobile_number && !/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({ response: "Mobile number must be exactly 10 digits" });
    }

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return res.status(404).json({ response: "Branch not found" });

    // Access Permission Check
    if (!req.user.super_user && branch.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ response: "Access denied to update this branch" });
    }

    const targetRestaurantId = req.user.super_user
      ? restaurant_id || branch.restaurant_id
      : req.user.restaurant_id;

    // 1. Duplicate Name Check
    if (name) {
      const duplicateName = await prisma.branch.findFirst({
        where: {
          NOT: { id },
          name: name.trim(),
          restaurant_id: targetRestaurantId,
        },
      });
      if (duplicateName) {
        return res.status(400).json({
          response: "Branch with same name already exists for this restaurant",
        });
      }
    }

    // 2. Duplicate Branch Code Check
    let updatedCode = branch.branch_code; // Default: पुरानै राख्‍ने
    if (branch_code && branch_code.trim()) {
      updatedCode = branch_code.trim().toUpperCase();

      const duplicateCode = await prisma.branch.findFirst({
        where: {
          NOT: { id },
          branch_code: updatedCode,
          restaurant_id: targetRestaurantId,
        },
      });

      if (duplicateCode) {
        return res.status(400).json({
          response: `Branch code '${updatedCode}' already exists for this restaurant`,
        });
      }
    }

    // 3. Database Update Executed
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name: name ? name.trim() : branch.name,
        address: address ? address.trim() : branch.address,
        mobile_number: mobile_number ? mobile_number.trim() : branch.mobile_number,
        restaurant_id: targetRestaurantId,
        branch_code: updatedCode, // 👈 DB मा अनिवार्य अपडेट हुन्छ
      },
    });

    res.json({
      message: "Branch updated successfully",
      data: updatedBranch,
    });
  } catch (err) {
    console.error("UPDATE BRANCH ERROR:", err);
    res.status(500).json({ response: err.message || "Server error" });
  }
};

/* ===================== DELETE BRANCH ===================== */
exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branchExists = await prisma.branch.findUnique({ where: { id } });
    if (!branchExists) return res.status(404).json({ response: "Branch not found" });

    if (!req.user.super_user && branchExists.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ response: "Access denied to delete this branch" });
    }

    await prisma.branch.delete({ where: { id } });

    res.json({ response: "Branch deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "Server error" });
  }
};