// const { prisma } = require("../config/dbConnect");
// const { hashPassword } = require("../utils/userUtils");

// // 1. Create Admin
// exports.createAdmin = async (req, res) => {
//   try {
//     const {
//       username,
//       password,
//       first_name,
//       last_name,
//       email,
//       mobile_number,
//       address,
//       restaurant,
//       branch,
//     } = req.body;

//     // Check super user permission
//     if (!req.user?.superUser && !req.user?.super_user) {
//       return res
//         .status(403)
//         .json({ response: "Only super user can create admin" });
//     }

//     // Check username uniqueness
//     const exists = await prisma.user.findUnique({
//       where: { username },
//     });
//     if (exists) {
//       return res.status(400).json({ response: "Username already exists" });
//     }

//     // Check email uniqueness
//     if (email) {
//       const emailExists = await prisma.user.findUnique({
//         where: { email },
//       });
//       if (emailExists) {
//         return res
//           .status(400)
//           .json({ response: "An account with this email already exists." });
//       }
//     }

//     // Hash Password before storing
//     const hashedPassword = await hashPassword(password);

//     const admin = await prisma.user.create({
//       data: {
//         username,
//         password: hashedPassword,
//         first_name,
//         last_name,
//         email,
//         mobile_number,
//         address,
//         restaurant_id: restaurant || null,
//         branch_id: branch || null,

//         // 🔒 Force values
//         super_user: false,
//         is_staff: true,
//         is_admin: true,
//       },
//     });

//     // Password field client responese ma select nagarna Destructuring:
//     const { password: _, ...adminData } = admin;

//     res.status(201).json({
//       response: "Admin created successfully",
//       data: adminData,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };

// // 2. Get Admins
// exports.getAdmins = async (req, res) => {
//   try {
//     const whereCondition = {
//       is_staff: true,
//       is_admin: true,
//     };

//     if (!req.user?.superUser && req.user?.restaurant) {
//       whereCondition.restaurant_id = req.user.restaurant;
//     }

//     const admins = await prisma.user.findMany({
//       where: whereCondition,
//       select: {
//         id: true,
//         username: true,
//         email: true,
//         first_name: true,
//         last_name: true,
//         mobile_number: true,
//         address: true,
//         role: true,
//         is_blocked: true,
//         blocked_at: true,
//         restaurant_id: true,
//         branch_id: true,
//         createdAt: true,
//       },
//     });

//     res.status(200).json({ data: admins });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };

// // 3. Update Admin
// exports.updateAdmin = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = { ...req.body };

//     // Check if admin exists
//     const admin = await prisma.user.findUnique({
//       where: { id },
//     });
//     if (!admin) return res.status(404).json({ response: "Admin not found" });

//     // Branch update check for duplicate admin assignment
//     if (updateData.branch) {
//       const duplicate = await prisma.user.findFirst({
//         where: {
//           NOT: { id },
//           branch_id: updateData.branch,
//         },
//       });

//       if (duplicate) {
//         return res.status(400).json({
//           response: "This branch already has an assigned admin.",
//         });
//       }
//     }

//     // Mapping fields for Prisma (e.g. restaurant -> restaurant_id)
//     if (updateData.restaurant) {
//       updateData.restaurant_id = updateData.restaurant;
//       delete updateData.restaurant;
//     }
//     if (updateData.branch) {
//       updateData.branch_id = updateData.branch;
//       delete updateData.branch;
//     }

//     // Password hash updates
//     if (updateData.password && updateData.password.trim() !== "") {
//       updateData.password = await hashPassword(updateData.password);
//     } else {
//       delete updateData.password; // Do not overwrite if password string is empty
//     }

//     // Perform Update
//     const updatedAdmin = await prisma.user.update({
//       where: { id },
//       data: updateData,
//     });

//     const { password: _, ...adminResponse } = updatedAdmin;

//     res.json({ response: "Admin updated successfully", data: adminResponse });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };

// // 4. Delete Admin
// exports.deleteAdmin = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await prisma.user.delete({
//       where: { id },
//     });
//     res.status(200).json({ response: "Admin deleted" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };

// // 5. Get Profile (Populate equivalent with Prisma include/select)
// exports.getProfile = async (req, res) => {
//   try {
//     const id = req.user._id || req.user.id || req.user.userId;

//     const user = await prisma.user.findUnique({
//       where: { id },
//       include: {
//         restaurant: {
//           select: {
//             name: true,
//             logo: true,
//             mobile_number: true,
//           },
//         },
//         branch: {
//           select: {
//             name: true,
//             mobile_number: true,
//           },
//         },
//       },
//     });

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, response: "User not found" });
//     }

//     const { password: _, ...userData } = user;

//     res.status(200).json({ success: true, data: userData });
//   } catch (error) {
//     console.error("Profile Error:", error);
//     res.status(500).json({ success: false, response: error.message });
//   }
// };

// // 6. Toggle Block Admin Status
// exports.toggleBlockAdmin = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const admin = await prisma.user.findUnique({
//       where: { id },
//     });
//     if (!admin) {
//       return res.status(404).json({ response: "Admin not found" });
//     }

//     // Never allow blocking a super user
//     if (admin.super_user) {
//       return res.status(403).json({
//         response: "Super user cannot be blocked",
//       });
//     }

//     const nextBlockStatus = !admin.is_blocked;

//     const updatedAdmin = await prisma.user.update({
//       where: { id },
//       data: {
//         is_blocked: nextBlockStatus,
//         blocked_at: nextBlockStatus ? new Date() : null,
//       },
//     });

//     return res.status(200).json({
//       response: updatedAdmin.is_blocked
//         ? "Admin blocked successfully"
//         : "Admin unblocked successfully",
//       is_blocked: updatedAdmin.is_blocked,
//     });
//   } catch (err) {
//     console.error("BLOCK TOGGLE ERROR:", err);
//     return res.status(500).json({ response: "Server error" });
//   }
// };




const { prisma } = require("../config/dbConnect");
const { hashPassword } = require("../utils/userUtils");

// 1. Create Admin
exports.createAdmin = async (req, res) => {
  try {
    let {
      username,
      password,
      first_name,
      last_name,
      email,
      mobile_number,
      address,
      restaurant,
      branch,
    } = req.body;

    // Super User नभएको खण्डमा आफ्नै restaurant_id enforce गर्ने
    if (!req.user.super_user) {
      if (!req.user.restaurant_id) {
        return res
          .status(400)
          .json({ response: "Admin is not associated with any restaurant" });
      }
      restaurant = req.user.restaurant_id;
    }

    // Check username uniqueness
    const exists = await prisma.user.findUnique({
      where: { username },
    });
    if (exists) {
      return res.status(400).json({ response: "Username already exists" });
    }

    // Check email uniqueness
    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ response: "An account with this email already exists." });
      }
    }

    // Hash Password before storing
    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        first_name,
        last_name,
        email,
        mobile_number,
        address,
        restaurant_id: restaurant || null,
        branch_id: branch || null,

        // 🔒 Force values
        super_user: false,
        is_admin: false,
        is_staff: true,
      },
    });

    const { password: _, ...adminData } = admin;

    res.status(201).json({
      response: "Admin created successfully",
      data: adminData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "Server error" });
  }
};

// 2. Get Admins
exports.getAdmins = async (req, res) => {
  try {
    // 🔹 Default Filter: Admin वा Staff मध्ये कुनै एक true भएका users
    const whereCondition = {
      OR: [
        { is_admin: true },
        { is_staff: true }
      ],
      super_user: false // Super user लाई exclude गर्न চাইলে (Optional)
    };

    // 🔹 Super user नभएमा आफ्नो restaurant_id सँग match हुने users मात्र फिल्टर गर्ने
    if (!req.user.super_user) {
      if (!req.user.restaurant_id) {
        return res.status(200).json({ data: [] });
      }
      whereCondition.restaurant_id = req.user.restaurant_id;
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        mobile_number: true,
        address: true,
        role: true,
        is_admin: true,  // 👈 Response मा कुन admin हो र कुन staff चिन्नका लागि
        is_staff: true,  // 👈 Response मा include गरिएको छ
        is_blocked: true,
        blocked_at: true,
        restaurant_id: true,
        branch_id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc', // पछिल्लो पटक बनेको data माथि देखाउन
      }
    });

    res.status(200).json({ data: users });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ response: "Server error" });
  }
};

// 3. Update Admin
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { id },
    });
    if (!admin) return res.status(404).json({ response: "Admin not found" });

    // Restrict access if regular admin tries to update someone outside their restaurant
    if (
      !req.user.super_user &&
      admin.restaurant_id !== req.user.restaurant_id
    ) {
      return res
        .status(403)
        .json({ response: "Access denied to update this user" });
    }

    // Regular admin cannot re-assign restaurant
    if (!req.user.super_user) {
      delete updateData.restaurant;
      delete updateData.restaurant_id;
    }

    // Branch update check for duplicate admin assignment
    if (updateData.branch) {
      const duplicate = await prisma.user.findFirst({
        where: {
          NOT: { id },
          branch_id: updateData.branch,
        },
      });

      if (duplicate) {
        return res.status(400).json({
          response: "This branch already has an assigned admin.",
        });
      }
    }

    // Mapping fields for Prisma
    if (updateData.restaurant) {
      updateData.restaurant_id = updateData.restaurant;
      delete updateData.restaurant;
    }
    if (updateData.branch) {
      updateData.branch_id = updateData.branch;
      delete updateData.branch;
    }

    // Password hash updates
    if (updateData.password && updateData.password.trim() !== "") {
      updateData.password = await hashPassword(updateData.password);
    } else {
      delete updateData.password;
    }

    // Perform Update
    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...adminResponse } = updatedAdmin;

    res.json({ response: "Admin updated successfully", data: adminResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "Server error" });
  }
};

// 4. Delete Admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await prisma.user.findUnique({
      where: { id },
    });
    if (!admin) return res.status(404).json({ response: "Admin not found" });

    if (
      !req.user.super_user &&
      admin.restaurant_id !== req.user.restaurant_id
    ) {
      return res
        .status(403)
        .json({ response: "Access denied to delete this user" });
    }

    await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({ response: "Admin deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "Server error" });
  }
};

// 5. Get Profile
exports.getProfile = async (req, res) => {
  try {
    const id = req.user.id || req.user._id || req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            name: true,
            logo: true,
            mobile_number: true,
          },
        },
        branch: {
          select: {
            name: true,
            mobile_number: true,
          },
        },
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, response: "User not found" });
    }

    const { password: _, ...userData } = user;

    res.status(200).json({ success: true, data: userData });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ success: false, response: error.message });
  }
};

// 6. Toggle Block Admin Status
exports.toggleBlockAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await prisma.user.findUnique({
      where: { id },
    });
    if (!admin) {
      return res.status(404).json({ response: "Admin not found" });
    }

    if (
      !req.user.super_user &&
      admin.restaurant_id !== req.user.restaurant_id
    ) {
      return res.status(403).json({ response: "Access denied" });
    }

    // Never allow blocking a super user
    if (admin.super_user) {
      return res.status(403).json({
        response: "Super user cannot be blocked",
      });
    }

    const nextBlockStatus = !admin.is_blocked;

    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: {
        is_blocked: nextBlockStatus,
        blocked_at: nextBlockStatus ? new Date() : null,
      },
    });

    return res.status(200).json({
      response: updatedAdmin.is_blocked
        ? "Admin blocked successfully"
        : "Admin unblocked successfully",
      is_blocked: updatedAdmin.is_blocked,
    });
  } catch (err) {
    console.error("BLOCK TOGGLE ERROR:", err);
    return res.status(500).json({ response: "Server error" });
  }
};
