// // const { prisma } = require("../config/dbConnect");

// // /* ===================== CREATE BRANCH ===================== */
// // exports.createBranch = async (req, res) => {
// //   try {
// //     const { name, address, mobile_number, restaurant_id } = req.body;

// //     if (!name || !address || !mobile_number || !restaurant_id)
// //       return res.status(400).json({ response: "All fields are required" });

// //     if (!/^[0-9]{10}$/.test(mobile_number))
// //       return res
// //         .status(400)
// //         .json({ response: "Mobile number must be exactly 10 digits" });

// //     // Check if restaurant exists
// //     const restaurantExists = await prisma.restaurant.findUnique({
// //       where: { id: restaurant_id },
// //     });
// //     if (!restaurantExists)
// //       return res.status(404).json({ response: "Restaurant not found" });

// //     // ✅ Check duplicate branch name in same restaurant
// //     const duplicate = await prisma.branch.findFirst({
// //       where: {
// //         name: name.trim(),
// //         restaurant_id: restaurant_id,
// //       },
// //     });
// //     if (duplicate)
// //       return res.status(400).json({
// //         response: "Branch with same name already exists for this restaurant",
// //       });

// //     const branch = await prisma.branch.create({
// //       data: {
// //         name: name.trim(),
// //         address: address.trim(),
// //         mobile_number,
// //         restaurant_id,
// //       },
// //     });

// //     res.status(201).json({ data: branch });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ response: "Server error" });
// //   }
// // };

// // /* ===================== GET ALL BRANCHES ===================== */
// // exports.getBranches = async (req, res) => {
// //   try {
// //     const branches = await prisma.branch.findMany({
// //       include: {
// //         restaurant: {
// //           select: { name: true },
// //         },
// //       },
// //       orderBy: { createdAt: "desc" },
// //     });

// //     const formatted = branches.map((b) => ({
// //       _id: b.id, // Frontend backward compatibility ko lagi
// //       id: b.id,
// //       name: b.name,
// //       address: b.address,
// //       mobile_number: b.mobile_number,
// //       restaurant_id: b.restaurant_id,
// //       restaurant_name: b.restaurant?.name || "-",
// //     }));

// //     res.json({ data: formatted });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ response: "Server error" });
// //   }
// // };

// // /* ===================== UPDATE BRANCH ===================== */
// // exports.updateBranch = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { name, address, mobile_number, restaurant_id } = req.body;

// //     if (mobile_number && !/^[0-9]{10}$/.test(mobile_number))
// //       return res
// //         .status(400)
// //         .json({ response: "Mobile number must be exactly 10 digits" });

// //     const branch = await prisma.branch.findUnique({
// //       where: { id },
// //     });
// //     if (!branch) return res.status(404).json({ response: "Branch not found" });

// //     // Use existing restaurant_id if not provided in update
// //     const r_id = restaurant_id || branch.restaurant_id;

// //     // Duplicate check
// //     if (name) {
// //       const duplicate = await prisma.branch.findFirst({
// //         where: {
// //           NOT: { id },
// //           name: name.trim(),
// //           restaurant_id: r_id,
// //         },
// //       });
// //       if (duplicate)
// //         return res.status(400).json({
// //           response: "Branch with same name already exists for this restaurant",
// //         });
// //     }

// //     // Perform Update
// //     const updatedBranch = await prisma.branch.update({
// //       where: { id },
// //       data: {
// //         name: name ? name.trim() : branch.name,
// //         address: address ? address.trim() : branch.address,
// //         mobile_number: mobile_number || branch.mobile_number,
// //         restaurant_id: r_id,
// //       },
// //     });

// //     res.json({ data: updatedBranch });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ response: "Server error" });
// //   }
// // };

// // /* ===================== DELETE BRANCH ===================== */
// // exports.deleteBranch = async (req, res) => {
// //   try {
// //     const { id } = req.params;

// //     // Check existing before delete
// //     const branchExists = await prisma.branch.findUnique({
// //       where: { id },
// //     });

// //     if (!branchExists)
// //       return res.status(404).json({ response: "Branch not found" });

// //     await prisma.branch.delete({
// //       where: { id },
// //     });

// //     res.json({ response: "Branch deleted successfully" });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ response: "Server error" });
// //   }
// // };


// const { prisma } = require("../config/dbConnect");

// /* ===================== CREATE BRANCH ===================== */
// exports.createBranch = async (req, res) => {
//   try {
//     let { name, address, mobile_number, restaurant_id } = req.body;

//     // Super user नभएको खण्डमा आफ्नै restaurant_id enforce गर्ने
//     if (!req.user.super_user) {
//       restaurant_id = req.user.restaurant_id;
//     }

//     if (!name || !address || !mobile_number || !restaurant_id)
//       return res.status(400).json({ response: "All fields are required" });

//     if (!/^[0-9]{10}$/.test(mobile_number))
//       return res
//         .status(400)
//         .json({ response: "Mobile number must be exactly 10 digits" });

//     // Check if restaurant exists
//     const restaurantExists = await prisma.restaurant.findUnique({
//       where: { id: restaurant_id },
//     });
//     if (!restaurantExists)
//       return res.status(404).json({ response: "Restaurant not found" });

//     // ✅ Check duplicate branch name in same restaurant
//     const duplicate = await prisma.branch.findFirst({
//       where: {
//         name: name.trim(),
//         restaurant_id: restaurant_id,
//       },
//     });
//     if (duplicate)
//       return res.status(400).json({
//         response: "Branch with same name already exists for this restaurant",
//       });

//     const branch = await prisma.branch.create({
//       data: {
//         name: name.trim(),
//         address: address.trim(),
//         mobile_number,
//         restaurant_id,
//       },
//     });

//     res.status(201).json({ data: branch });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };

// /* ===================== GET ALL BRANCHES ===================== */
// exports.getBranches = async (req, res) => {
//   try {
//     const whereCondition = {};

//     // Filter by restaurant if user is not Super User
//     if (!req.user.super_user) {
//       whereCondition.restaurant_id = req.user.restaurant_id;
//     }

//     const branches = await prisma.branch.findMany({
//       where: whereCondition,
//       include: {
//         restaurant: {
//           select: { name: true },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     const formatted = branches.map((b) => ({
//       _id: b.id,
//       id: b.id,
//       name: b.name,
//       address: b.address,
//       mobile_number: b.mobile_number,
//       restaurant_id: b.restaurant_id,
//       restaurant_name: b.restaurant?.name || "-",
//     }));

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

//     if (mobile_number && !/^[0-9]{10}$/.test(mobile_number))
//       return res
//         .status(400)
//         .json({ response: "Mobile number must be exactly 10 digits" });

//     const branch = await prisma.branch.findUnique({
//       where: { id },
//     });
//     if (!branch) return res.status(404).json({ response: "Branch not found" });

//     // Unauthorized access prevention
//     if (!req.user.super_user && branch.restaurant_id !== req.user.restaurant_id) {
//       return res.status(403).json({ response: "Access denied to update this branch" });
//     }

//     const r_id = req.user.super_user
//       ? restaurant_id || branch.restaurant_id
//       : req.user.restaurant_id;

//     // Duplicate check
//     if (name) {
//       const duplicate = await prisma.branch.findFirst({
//         where: {
//           NOT: { id },
//           name: name.trim(),
//           restaurant_id: r_id,
//         },
//       });
//       if (duplicate)
//         return res.status(400).json({
//           response: "Branch with same name already exists for this restaurant",
//         });
//     }

//     // Perform Update
//     const updatedBranch = await prisma.branch.update({
//       where: { id },
//       data: {
//         name: name ? name.trim() : branch.name,
//         address: address ? address.trim() : branch.address,
//         mobile_number: mobile_number || branch.mobile_number,
//         restaurant_id: r_id,
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

//     const branchExists = await prisma.branch.findUnique({
//       where: { id },
//     });

//     if (!branchExists)
//       return res.status(404).json({ response: "Branch not found" });

//     // Unauthorized access check
//     if (!req.user.super_user && branchExists.restaurant_id !== req.user.restaurant_id) {
//       return res.status(403).json({ response: "Access denied to delete this branch" });
//     }

//     await prisma.branch.delete({
//       where: { id },
//     });

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
exports.createBranch = async (req, res) => {
  try {
    let { name, address, mobile_number, restaurant_id, plan_type, plan_id } = req.body;

    // SuperAdmin नभएको खण्डमा आफ्नै restaurant_id Enforce गर्ने
    if (!req.user.super_user) {
      restaurant_id = req.user.restaurant_id;
    }

    if (!name || !address || !mobile_number || !restaurant_id) {
      return res.status(400).json({ response: "All fields including restaurant_id are required" });
    }

    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({ response: "Mobile number must be exactly 10 digits" });
    }

    // Check if restaurant exists
    const restaurantExists = await prisma.restaurant.findUnique({
      where: { id: restaurant_id },
    });
    if (!restaurantExists) {
      return res.status(404).json({ response: "Restaurant not found" });
    }

    // Duplicate check within same restaurant
    const duplicate = await prisma.branch.findFirst({
      where: {
        name: name.trim(),
        restaurant_id: restaurant_id,
      },
    });
    if (duplicate) {
      return res.status(400).json({
        response: "Branch with same name already exists for this restaurant",
      });
    }

    if (plan_type && !VALID_PLAN_TYPES.includes(plan_type)) {
      return res.status(400).json({
        response: `Invalid plan_type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          name: name.trim(),
          address: address.trim(),
          mobile_number,
          restaurant_id,
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
    res.status(500).json({ response: err.message || "Server error" });
  }
};

/* ===================== GET ALL BRANCHES ===================== */
exports.getBranches = async (req, res) => {
  try {
    const whereCondition = {};

    // Filter by restaurant if user is not SuperAdmin
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
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, mobile_number, restaurant_id } = req.body;

    if (mobile_number && !/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({ response: "Mobile number must be exactly 10 digits" });
    }

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return res.status(404).json({ response: "Branch not found" });

    // Unauthorized access prevention
    if (!req.user.super_user && branch.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ response: "Access denied to update this branch" });
    }

    const targetRestaurantId = req.user.super_user
      ? restaurant_id || branch.restaurant_id
      : req.user.restaurant_id;

    if (name) {
      const duplicate = await prisma.branch.findFirst({
        where: {
          NOT: { id },
          name: name.trim(),
          restaurant_id: targetRestaurantId,
        },
      });
      if (duplicate) {
        return res.status(400).json({
          response: "Branch with same name already exists for this restaurant",
        });
      }
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name: name ? name.trim() : branch.name,
        address: address ? address.trim() : branch.address,
        mobile_number: mobile_number || branch.mobile_number,
        restaurant_id: targetRestaurantId,
      },
    });

    res.json({ data: updatedBranch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "Server error" });
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