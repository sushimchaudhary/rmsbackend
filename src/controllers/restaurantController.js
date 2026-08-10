// const { prisma } = require("../config/dbConnect");
// const uploadToCloudinary = require("../utils/cloudinaryUpload");

// exports.createRestaurant = async (req, res) => {
//   try {
//     if (!req.body) {
//       return res.status(400).json({ response: "Request body is empty" });
//     }

//     const { name, address, mobile_number } = req.body;

//     const cleanName = name ? String(name).trim() : "";
//     const cleanAddress = address ? String(address).trim() : "";
//     const cleanMobile = mobile_number ? String(mobile_number).trim() : "";

//     let logo = null;

//     if (req.file) {
//       const result = await uploadToCloudinary(
//         req.file.buffer,
//         "kitchenos/restaurants"
//       );
//       logo = result.secure_url;
//     }

//     if (!cleanName || !cleanAddress || !cleanMobile) {
//       return res.status(400).json({ response: "All fields are required" });
//     }

//     if (!/^[0-9]{10}$/.test(cleanMobile)) {
//       return res
//         .status(400)
//         .json({ response: "Mobile number must be 10 digits" });
//     }

//     // १. Name duplicate check
//     const nameExists = await prisma.restaurant.findFirst({
//       where: { name: cleanName },
//     });
//     if (nameExists) {
//       return res
//         .status(400)
//         .json({ response: "Restaurant name already exists" });
//     }

//     // २. Mobile number duplicate check
//     const mobileExists = await prisma.restaurant.findFirst({
//       where: { mobile_number: cleanMobile },
//     });
//     if (mobileExists) {
//       return res.status(400).json({ response: "Mobile number already exists" });
//     }

//     const restaurant = await prisma.restaurant.create({
//       data: {
//         name: cleanName,
//         address: cleanAddress,
//         mobile_number: cleanMobile,
//         logo,
//       },
//     });

//     res.status(201).json({ data: restaurant });
//   } catch (err) {
//     console.error("CREATE ERROR:", err);
//     res.status(500).json({ response: "Internal server error" });
//   }
// };

// exports.getRestaurants = async (req, res) => {
//   try {
//     const restaurants = await prisma.restaurant.findMany({
//       orderBy: { createdAt: "desc" },
//     });
//     res.json({ data: restaurants });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ response: "Server error" });
//   }
// };

// exports.getRestaurantById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const restaurant = await prisma.restaurant.findUnique({
//       where: { id },
//     });

//     if (!restaurant) {
//       return res.status(404).json({ response: "Restaurant not found" });
//     }

//     res.json({ data: restaurant });
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ response: "Invalid restaurant ID" });
//   }
// };

// exports.updateRestaurant = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // १. पहिले रेस्टुरेन्ट खोज्नुहोस्
//     const restaurant = await prisma.restaurant.findUnique({
//       where: { id },
//     });

//     if (!restaurant) {
//       return res.status(404).json({ response: "Restaurant not found" });
//     }

//     // २. Body बाट आएका Field हरू ट्रिम गर्नुहोस्
//     const name = req.body.name ? String(req.body.name).trim() : undefined;
//     const address = req.body.address ? String(req.body.address).trim() : undefined;
//     const mobile_number = req.body.mobile_number ? String(req.body.mobile_number).trim() : undefined;

//     // ३. Duplicate Name Check
//     if (name && name !== restaurant.name) {
//       const exists = await prisma.restaurant.findFirst({
//         where: {
//           name,
//           NOT: { id },
//         },
//       });
//       if (exists) {
//         return res.status(400).json({ response: "Restaurant name already exists" });
//       }
//     }

//     // ४. Mobile Validation & Duplicate Check
//     if (mobile_number) {
//       if (!/^[0-9]{10}$/.test(mobile_number)) {
//         return res.status(400).json({ response: "Mobile number must be exactly 10 digits" });
//       }

//       if (mobile_number !== restaurant.mobile_number) {
//         const mobileExists = await prisma.restaurant.findFirst({
//           where: {
//             mobile_number,
//             NOT: { id },
//           },
//         });
//         if (mobileExists) {
//           return res.status(400).json({ response: "Mobile number already exists" });
//         }
//       }
//     }

//     // ५. अपडेट डेटा बनाउनुहोस्
//     let updateData = {};
//     if (name) updateData.name = name;
//     if (address) updateData.address = address;
//     if (mobile_number) updateData.mobile_number = mobile_number;

//     // ६. नयाँ फोटो आएको छ भने मात्र Cloudinary मा upload गर्नुहोस्
//     if (req.file) {
//       const result = await uploadToCloudinary(
//         req.file.buffer,
//         "kitchenos/restaurants"
//       );
//       updateData.logo = result.secure_url;
//     }

//     const updatedRestaurant = await prisma.restaurant.update({
//       where: { id },
//       data: updateData,
//     });

//     res.json({ data: updatedRestaurant });
//   } catch (err) {
//     console.error("UPDATE ERROR:", err);

//     if (err.code === "P2002") {
//       const target = err.meta?.target ? err.meta.target.join(", ") : "field";
//       return res.status(400).json({
//         response: `${target.replace("_", " ")} already exists`,
//       });
//     }

//     res.status(500).json({ response: "Server error" });
//   }
// };

// exports.deleteRestaurant = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const restaurant = await prisma.restaurant.findUnique({
//       where: { id },
//     });

//     if (!restaurant) {
//       return res.status(404).json({ response: "Restaurant not found" });
//     }

//     await prisma.restaurant.delete({
//       where: { id },
//     });

//     res.json({ response: "Restaurant deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ response: "Invalid restaurant ID" });
//   }
// };


const { prisma } = require("../config/dbConnect");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

/* ===================== CREATE RESTAURANT ===================== */
exports.createRestaurant = async (req, res) => {
  try {
    // Only super user should be allowed to create new restaurants
    if (!req.user.super_user) {
      return res.status(403).json({ response: "Only super user can create a restaurant" });
    }

    if (!req.body) {
      return res.status(400).json({ response: "Request body is empty" });
    }

    const { name, address, mobile_number } = req.body;

    const cleanName = name ? String(name).trim() : "";
    const cleanAddress = address ? String(address).trim() : "";
    const cleanMobile = mobile_number ? String(mobile_number).trim() : "";

    let logo = null;

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "kitchenos/restaurants"
      );
      logo = result.secure_url;
    }

    if (!cleanName || !cleanAddress || !cleanMobile) {
      return res.status(400).json({ response: "All fields are required" });
    }

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      return res
        .status(400)
        .json({ response: "Mobile number must be 10 digits" });
    }

    // १. Name duplicate check
    const nameExists = await prisma.restaurant.findFirst({
      where: { name: cleanName },
    });
    if (nameExists) {
      return res
        .status(400)
        .json({ response: "Restaurant name already exists" });
    }

    // २. Mobile number duplicate check
    const mobileExists = await prisma.restaurant.findFirst({
      where: { mobile_number: cleanMobile },
    });
    if (mobileExists) {
      return res.status(400).json({ response: "Mobile number already exists" });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: cleanName,
        address: cleanAddress,
        mobile_number: cleanMobile,
        logo,
      },
    });

    res.status(201).json({ data: restaurant });
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ response: "Internal server error" });
  }
};

/* ===================== GET ALL RESTAURANTS ===================== */
exports.getRestaurants = async (req, res) => {
  try {
    const whereCondition = {};

    // Super user नभएको अवस्थामा, आफ्नो restaurant_id भएको मात्र Filter गर्ने
    if (!req.user.super_user) {
      if (!req.user.restaurant_id) {
        return res.json({ data: [] });
      }
      whereCondition.id = req.user.restaurant_id;
    }

    const restaurants = await prisma.restaurant.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: restaurants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "Server error" });
  }
};

/* ===================== GET RESTAURANT BY ID ===================== */
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    // Unauthorized access prevention for normal admin
    if (!req.user.super_user && req.user.restaurant_id !== id) {
      return res.status(403).json({ response: "Access denied to this restaurant" });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      return res.status(404).json({ response: "Restaurant not found" });
    }

    res.json({ data: restaurant });
  } catch (err) {
    console.error(err);
    res.status(400).json({ response: "Invalid restaurant ID" });
  }
};

/* ===================== UPDATE RESTAURANT ===================== */
exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    // Unauthorized check
    if (!req.user.super_user && req.user.restaurant_id !== id) {
      return res.status(403).json({ response: "Access denied to update this restaurant" });
    }

    // १. पहिले रेस्टुरेन्ट खोज्नुहोस्
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      return res.status(404).json({ response: "Restaurant not found" });
    }

    // २. Body बाट आएका Field हरू ट्रिम गर्नुहोस्
    const name = req.body.name ? String(req.body.name).trim() : undefined;
    const address = req.body.address ? String(req.body.address).trim() : undefined;
    const mobile_number = req.body.mobile_number ? String(req.body.mobile_number).trim() : undefined;

    // ३. Duplicate Name Check
    if (name && name !== restaurant.name) {
      const exists = await prisma.restaurant.findFirst({
        where: {
          name,
          NOT: { id },
        },
      });
      if (exists) {
        return res.status(400).json({ response: "Restaurant name already exists" });
      }
    }

    // ४. Mobile Validation & Duplicate Check
    if (mobile_number) {
      if (!/^[0-9]{10}$/.test(mobile_number)) {
        return res.status(400).json({ response: "Mobile number must be exactly 10 digits" });
      }

      if (mobile_number !== restaurant.mobile_number) {
        const mobileExists = await prisma.restaurant.findFirst({
          where: {
            mobile_number,
            NOT: { id },
          },
        });
        if (mobileExists) {
          return res.status(400).json({ response: "Mobile number already exists" });
        }
      }
    }

    // ५. अपडेट डेटा बनाउनुहोस्
    let updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (mobile_number) updateData.mobile_number = mobile_number;

    // ६. नयाँ फोटो आएको छ भने मात्र Cloudinary मा upload गर्नुहोस्
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "kitchenos/restaurants"
      );
      updateData.logo = result.secure_url;
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    res.json({ data: updatedRestaurant });
  } catch (err) {
    console.error("UPDATE ERROR:", err);

    if (err.code === "P2002") {
      const target = err.meta?.target ? err.meta.target.join(", ") : "field";
      return res.status(400).json({
        response: `${target.replace("_", " ")} already exists`,
      });
    }

    res.status(500).json({ response: "Server error" });
  }
};

/* ===================== DELETE RESTAURANT ===================== */
exports.deleteRestaurant = async (req, res) => {
  try {
    // Restaurant delete गर्ने अधिकार Super User लाई मात्र हुनुपर्छ
    if (!req.user.super_user) {
      return res.status(403).json({ response: "Only super user can delete a restaurant" });
    }

    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      return res.status(404).json({ response: "Restaurant not found" });
    }

    await prisma.restaurant.delete({
      where: { id },
    });

    res.json({ response: "Restaurant deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ response: "Invalid restaurant ID" });
  }
};