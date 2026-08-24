// const { prisma } = require("../config/dbConnect");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");
// const { hashPassword, comparePassword } = require("../utils/userUtils");

// // 1. LOGIN
// exports.login = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // 🔒 1. Input Validation: Check if fields exist and are strings
//     if (!username || typeof username !== "string" || !username.trim()) {
//       return res.status(400).json({ response: "Username is required." });
//     }

//     if (!password) {
//       return res.status(400).json({ response: "Password is required." });
//     }

//     // 🔍 2. User Search using findFirst for safe matching
//     const cleanUsername = username.trim();
//     const user = await prisma.user.findFirst({
//       where: {
//         username: cleanUsername
//       },
//       include: {
//         restaurant: true,
//         branch: true,
//       },
//     });

//     if (!user) {
//       return res.status(400).json({ response: "User not found" });
//     }

//     // 🔒 3. Block Check
//     if (user.is_blocked) {
//       return res.status(403).json({
//         response: "You are blocked. Please contact support teams.",
//       });
//     }

//     // 🔑 4. Password Verification
//     const isMatch = await comparePassword(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ response: "Incorrect password" });
//     }

//     // 🎟️ 5. Generate JWT Token
//     const token = jwt.sign(
//       {
//         userId: user.id,
//         isAdmin: user.is_admin,
//         isStaff: user.is_staff,
//         superUser: user.super_user,
//         restaurant: user.restaurant_id || null,
//         branch: user.branch_id || null,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.json({
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         first_name: user.first_name,
//         last_name: user.last_name,
//         email: user.email,
//         super_user: user.super_user,
//         is_admin: user.is_admin,
//         is_staff: user.is_staff,
//         restaurant: user.restaurant_id || null,
//         branch: user.branch_id || null,
//       },
//     });
//   } catch (err) {
//     console.error("LOGIN ERROR:", err);
//     return res.status(500).json({
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// // 2. FORGOT PASSWORD
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ detail: "Email is required." });
//     }

//     const user = await prisma.user.findFirst({
//       where: { email: email.trim() },
//     });

//     if (!user) {
//       return res
//         .status(404)
//         .json({ detail: "User with this email does not exist." });
//     }

//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

//     // Save reset token details in Database
//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         resetPasswordToken: resetToken,
//         resetPasswordExpire: resetPasswordExpire,
//       },
//     });

//     const resetUrl = `http://localhost:3000/reset-password/${user.id}/${resetToken}`;

//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: `"Support Team" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: "🔒 Password Reset Request",
//       html: `
//         <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e4e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">

//           <div style="text-align: center; margin-bottom: 25px;">
//             <h2 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
//               Password Reset
//             </h2>
//           </div>

//           <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />

//           <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
//             Hello <strong>${user.first_name || user.username}</strong>,
//           </p>

//           <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
//             We received a request to reset the password for your account. Click the button below to set up a new password:
//           </p>

//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${resetUrl}"
//                style="background-color: #06B6D4; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; transition: background-color 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
//               Reset Password
//             </a>
//           </div>

//           <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
//             <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
//               <strong>⏱️ Security Notice:</strong> This link will expire in <strong>1 hour</strong>. After that, you will need to submit a new request.
//             </p>
//           </div>

//           <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
//             If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
//           </p>

//           <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />

//           <div style="text-align: center;">
//             <p style="color: #94a3b8; font-size: 12px; margin: 0 0 5px 0;">
//               This is an automated email. Please do not reply directly to this message.
//             </p>
//             <p style="color: #94a3b8; font-size: 12px; margin: 0;">
//               © ${new Date().getFullYear()} RMS. All rights reserved.
//             </p>
//           </div>

//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ response: "Reset link sent successfully!" });
//   } catch (err) {
//     console.error("FORGOT PASSWORD ERROR:", err);
//     res.status(500).json({ detail: "Server error." });
//   }
// };

// // 3. RESET PASSWORD
// exports.resetPassword = async (req, res) => {
//   try {
//     const { uidb64, token, new_password } = req.body;

//     if (!uidb64 || !token || !new_password) {
//       return res.status(400).json({ detail: "Missing required fields." });
//     }

//     const user = await prisma.user.findFirst({
//       where: {
//         id: uidb64,
//         resetPasswordToken: token,
//         resetPasswordExpire: {
//           gt: new Date(),
//         },
//       },
//     });

//     if (!user) {
//       return res.status(400).json({ detail: "Invalid token or expired link." });
//     }

//     const hashedPassword = await hashPassword(new_password);

//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         password: hashedPassword,
//         resetPasswordToken: null,
//         resetPasswordExpire: null,
//       },
//     });

//     res.status(200).json({ message: "Password updated successfully!" });
//   } catch (err) {
//     console.error("RESET PASSWORD ERROR:", err);
//     res.status(500).json({ detail: "Server error." });
//   }
// };

// // 4. CHANGE PASSWORD
// exports.changePassword = async (req, res) => {
//   try {
//     const { old_password, new_password } = req.body;
//     const userId = req.user?.userId || req.user?.id;

//     if (!userId) {
//       return res.status(401).json({ detail: "Unauthorized access" });
//     }

//     if (!old_password || !new_password) {
//       return res.status(400).json({ detail: "Both old and new password are required." });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });
//     if (!user) {
//       return res.status(404).json({ detail: "User not found" });
//     }

//     const isMatch = await comparePassword(old_password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ detail: "Incorrect current password" });
//     }

//     const hashedPassword = await hashPassword(new_password);

//     await prisma.user.update({
//       where: { id: userId },
//       data: { password: hashedPassword },
//     });

//     res.status(200).json({ response: "Password updated successfully!" });
//   } catch (err) {
//     console.error("Change Password Error:", err);
//     res.status(500).json({ detail: "Server error occurred. Please try again." });
//   }
// };

const { prisma } = require("../config/dbConnect");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { hashPassword, comparePassword } = require("../utils/userUtils");
const { getBranchSubscriptionStatus } = require("../utils/subscriptionUtils");

const path = require("path");

// 1. LOGIN (With Branch Trial/Subscription Check)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔒 1. Input Validation
    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ response: "Username is required." });
    }

    if (!password) {
      return res.status(400).json({ response: "Password is required." });
    }

    // 🔍 2. User Search with Branch and Restaurant included
    const cleanUsername = username.trim();
    const user = await prisma.user.findFirst({
      where: {
        username: cleanUsername,
      },
      include: {
        restaurant: true,
        branch: true,
      },
    });

    if (!user) {
      return res.status(400).json({ response: "User not found" });
    }

    // 🔒 3. Block Check
    if (user.is_blocked) {
      return res.status(403).json({
        response: "You are blocked. Please contact support teams.",
      });
    }

    // 🔑 4. Password Verification
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ response: "Incorrect password" });
    }

    // 🎭 5. Determine Role Flags (Prisma Role Enum: 'staff' | 'admin' | 'super_admin')
    const userRole = user.role || "staff";
    const isSuperAdmin = userRole === "super_admin" || Boolean(user.super_user);
    const isAdmin = userRole === "admin" || Boolean(user.is_admin);
    const isStaff = userRole === "staff" || Boolean(user.is_staff);

    // ⏳ 6. BRANCH TRIAL / SUBSCRIPTION CHECK (Superadmin बाहेक)
    // if (!isSuperAdmin) {
    //   const branch = user.branch;

    //   if (branch) {
    //     const branchCreatedDate = new Date(branch.createdAt);
    //     const trialEndDate = new Date(branchCreatedDate);
    //     trialEndDate.setDate(branchCreatedDate.getDate() + 2); // 2 दिनको Trial

    //     const currentDate = new Date();

    //     // यदि 2 दिनको Trial बितिसकेको छ भने Login ब्लक गर्ने
    //     if (currentDate > trialEndDate) {
    //       return res.status(402).json({
    //         success: false,
    //         is_expired: true,
    //         error_code: "SUBSCRIPTION_EXPIRED",
    //         response: `The 1-month free trial for '${branch.name}' branch has expired (Created on: ${branchCreatedDate.toLocaleDateString()}). Please renew subscription to log in.`,
    //       });
    //     }
    //   }
    // }
    // ⏳ 6. BRANCH TRIAL / SUBSCRIPTION CHECK (Superadmin बाहेक)
    if (!isSuperAdmin && user.branch_id) {
      // DB बाट Branch को पछिल्लो Subscription तान्ने
      const latestSubscription = await prisma.restaurantSubscription.findFirst({
        where: { branch_id: user.branch_id },
        orderBy: { created_at: "desc" },
        include: { plan: true },
      });

      const subStatus = getBranchSubscriptionStatus(
        user.branch,
        latestSubscription,
      );

      if (subStatus.is_expired) {
        return res.status(402).json({
          success: false,
          is_expired: true,
          error_code: "SUBSCRIPTION_EXPIRED",
          response: `The subscription/trial for '${user.branch.name}' branch has expired. Please renew your subscription to log in.`,
        });
      }
    }

    // 🎟️ 7. Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        role: userRole,
        isAdmin: isAdmin,
        isStaff: isStaff,
        superUser: isSuperAdmin,
        restaurant: user.restaurant_id || null,
        branch: user.branch_id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 🚀 8. Return Response
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: userRole, // Enum string ('staff' | 'admin' | 'super_admin')
        super_user: isSuperAdmin, // Boolean
        is_admin: isAdmin, // Boolean
        is_staff: isStaff, // Boolean
        restaurant: user.restaurant_id || null,
        branch: user.branch_id || null,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

// 2. FORGOT PASSWORD
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ detail: "Email is required." });
//     }

//     const user = await prisma.user.findFirst({
//       where: { email: email.trim() },
//     });

//     if (!user) {
//       return res
//         .status(404)
//         .json({ detail: "User with this email does not exist." });
//     }

//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         resetPasswordToken: resetToken,
//         resetPasswordExpire: resetPasswordExpire,
//       },
//     });

//     const resetUrl = `${process.env.FRONTEND_MENU_URL}/reset-password/${user.id}/${resetToken}`;

//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: `"Support Team" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: "🔒 Password Reset Request",
//       html: `
//         <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e4e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
//           <div style="text-align: center; margin-bottom: 25px;">
//             <h2 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
//               Password Reset
//             </h2>
//           </div>
//           <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />
//           <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
//             Hello <strong>${user.first_name || user.username}</strong>,
//           </p>
//           <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
//             We received a request to reset the password for your account. Click the button below to set up a new password:
//           </p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${resetUrl}"
//                style="background-color: #06B6D4; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; transition: background-color 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
//               Reset Password
//             </a>
//           </div>
//           <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
//             <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
//               <strong>⏱️ Security Notice:</strong> This link will expire in <strong>1 hour</strong>. After that, you will need to submit a new request.
//             </p>
//           </div>
//           <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
//             If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
//           </p>
//           <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
//           <div style="text-align: center;">
//             <p style="color: #94a3b8; font-size: 12px; margin: 0 0 5px 0;">
//               This is an automated email. Please do not reply directly to this message.
//             </p>
//             <p style="color: #94a3b8; font-size: 12px; margin: 0;">
//               © ${new Date().getFullYear()} RMS. All rights reserved.
//             </p>
//           </div>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ response: "Reset link sent successfully!" });
//   } catch (err) {
//     console.error("FORGOT PASSWORD ERROR:", err);
//     res.status(500).json({ detail: "Server error." });
//   }
// };
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ detail: "Email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res
        .status(404)
        .json({ detail: "User with this email does not exist." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpire: resetPasswordExpire,
      },
    });

    const resetUrl = `${process.env.FRONTEND_MENU_URL}/reset-password/${user.id}/${resetToken}`;
    const userName = user.first_name || user.username || "Valued Customer";

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"RestoSync Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔒 Reset Your RestoSync Password",
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
          
          <!-- Text Branding Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 26px; font-weight: 800; color: #06B6D4; letter-spacing: -0.5px; display: inline-block;">
              RestoSync
            </span>
            <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
              Password Reset Request
            </h2>
          </div>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />

          <!-- Body Content -->
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 12px;">
            Hello <strong>${userName}</strong>,
          </p>

          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
            We received a request to reset the password for your <strong>RestoSync</strong> account. Click the button below to set up a new password:
          </p>

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}"
               style="background-color: #06B6D4; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
              Reset Password
            </a>
          </div>

          <!-- Security Alert Box -->
          <div style="background-color: #eff6ff; border-left: 4px solid #06B6D4; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; color: #046680; font-size: 14px; line-height: 1.5;">
              <strong>⏱️ Security Notice:</strong> This link will expire in <strong>1 hour</strong>. After that, you will need to submit a new request.
            </p>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />

          <!-- Footer -->
          <div style="text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 6px 0;">
              This is an automated email from RestoSync. Please do not reply directly to this message.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} RestoSync. All rights reserved.
            </p>
          </div>

        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ response: "Reset link sent successfully!" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ detail: "Server error." });
  }
};


// 3. RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { uidb64, token, new_password } = req.body;

    if (!uidb64 || !token || !new_password) {
      return res.status(400).json({ detail: "Missing required fields." });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: uidb64,
        resetPasswordToken: token,
        resetPasswordExpire: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ detail: "Invalid token or expired link." });
    }

    const hashedPassword = await hashPassword(new_password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ detail: "Server error." });
  }
};

// 4. CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ detail: "Unauthorized access" });
    }

    if (!old_password || !new_password) {
      return res
        .status(400)
        .json({ detail: "Both old and new password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    const isMatch = await comparePassword(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ detail: "Incorrect current password" });
    }

    const hashedPassword = await hashPassword(new_password);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ response: "Password updated successfully!" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res
      .status(500)
      .json({ detail: "Server error occurred. Please try again." });
  }
};
