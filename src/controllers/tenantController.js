const { prisma } = require("../config/dbConnect");
const { hashPassword } = require("../utils/userUtils");
const jwt = require("jsonwebtoken");

// 1. REGISTER TENANT (Creates Restaurant Owner as Admin)
exports.registerTenant = async (req, res) => {
  try {
    const {
      name,            // Restaurant Name
      address,         // Restaurant Address
      mobile_number,   // Restaurant Contact Number
      logo,            // Optional
      username,        // Owner Login Username
      email,           // Owner Login Email
      password,        // Owner Password
      first_name,      // Owner First Name
      last_name,       // Owner Last Name
    } = req.body;

    // 🔒 Validation
    if (!name || !mobile_number || !username || !email || !password) {
      return res.status(400).json({
        response: "Restaurant Name, Phone, Owner Username, Email, and Password are required.",
      });
    }

    const cleanMobile = mobile_number.trim();
    const cleanName = name.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    // Uniqueness Checks
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    if (existingUser) {
      return res.status(400).json({ response: "Username already taken." });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      return res.status(400).json({ response: "Email already registered." });
    }

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { name: cleanName },
    });
    if (existingRestaurant) {
      return res.status(400).json({ response: "Restaurant name already exists." });
    }

    const existingRestaurantPhone = await prisma.restaurant.findUnique({
      where: { mobile_number: cleanMobile },
    });
    if (existingRestaurantPhone) {
      return res.status(400).json({
        response: "A restaurant with this mobile number already exists.",
      });
    }

    // Hash Password
    const hashedPassword = await hashPassword(password);

    // 🔄 Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {

      // Step A: Create Restaurant
      const newRestaurant = await tx.restaurant.create({
        data: {
          name: cleanName,
          address: address || "",
          mobile_number: cleanMobile,
          logo: logo || null,
        },
      });

      // Step B: Create Restaurant Owner Admin User (Requires explicitly setting is_admin: true)
      const ownerUser = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          password: hashedPassword,
          first_name: first_name || "",
          last_name: last_name || "",
          mobile_number: cleanMobile,
          role: "admin",        // 👈 Explicit Role Enum
          is_admin: true,       // 👈 Explicitly True for Tenant Owner
          is_staff: false,      // 👈 Admin owner is not staff
          super_user: false,
          restaurant_id: newRestaurant.id,
          branch_id: null,
        },
      });

      // Step C: Setup 1-Week (7 Days) Free Trial Plan & Subscription
      const subPlanModel = tx.subscriptionPlan || tx.SubscriptionPlan;
      const subModel = tx.restaurantSubscription || tx.RestaurantSubscription;

      if (!subPlanModel || !subModel) {
        throw new Error("Subscription models not found in Prisma Client. Run `npx prisma generate` and restart server.");
      }

      let trialPlan = await subPlanModel.findFirst({
        where: { type: "free_trial" },
      });

      if (!trialPlan) {
        trialPlan = await subPlanModel.create({
          data: {
            name: "1-Week Free Trial",
            type: "free_trial",
            price: 0.00,
            duration_days: 7,
          },
        });
      }

      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialStartDate.getDate() + 7);

      const subscription = await subModel.create({
        data: {
          restaurant_id: newRestaurant.id,
          plan_id: trialPlan.id,
          status: "trial",
          start_date: trialStartDate,
          end_date: trialEndDate,
        },
      });

      return { restaurant: newRestaurant, user: ownerUser, subscription };
    });

    // Token Generation
    const token = jwt.sign(
      {
        userId: result.user.id,
        role: result.user.role,
        isAdmin: result.user.is_admin,
        isStaff: result.user.is_staff,
        superUser: result.user.super_user,
        restaurant: result.restaurant.id,
        branch: null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userData } = result.user;

    res.status(201).json({
      response: "Restaurant registered successfully with 1-week free trial!",
      token,
      data: {
        restaurant: result.restaurant,
        user: userData,
        subscription: result.subscription,
      },
    });
  } catch (err) {
    console.error("REGISTER TENANT ERROR:", err);
    res.status(500).json({ response: err.message || "Server error during restaurant registration." });
  }
};