const { prisma } = require('../config/dbConnect');
const uploadToCloudinary = require('../utils/cloudinaryUpload');
const { emitEvent } = require('../utils/socket');

// Prisma relation selection for consistent response output
const noticeInclude = {
  restaurant: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  seenUsers: {
    select: {
      id: true,
      username: true,
      first_name: true,
      last_name: true,
      email: true,
      role: true,
    },
  },
};

// Helper: Check if logged in user is Super Admin
const isSuperAdmin = (user) => {
  return (
    user?.role === 'superadmin' ||
    user?.isSuperuser ||
    user?.super_user
  );
};

// 🟢 GET /api/notices (Fetch All Notices)
const getAll = async (req, res, next) => {
  try {
    let where = {};

    // Super Admin ले Query params बाट filter गर्न सक्छ
    if (isSuperAdmin(req.user)) {
      if (req.query.branch) where.branch_id = req.query.branch;
      if (req.query.restaurant) where.restaurant_id = req.query.restaurant;
    } else {
      // Normal Branch/Staff user को लागि
      const userBranch = req.user?.branch_id || req.user?.branch;
      if (!userBranch) {
        return res.status(401).json({ error: "Access denied: Branch not assigned." });
      }
      where.branch_id = userBranch;
    }

    const notices = await prisma.notice.findMany({
      where,
      include: noticeInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(notices);
  } catch (err) {
    next(err);
  }
};

// 🟢 GET /api/notices/:id (Fetch Single Notice)
const getOne = async (req, res, next) => {
  try {
    let where = { id: req.params.id };

    if (!isSuperAdmin(req.user)) {
      const userBranch = req.user?.branch_id || req.user?.branch;
      if (!userBranch) {
        return res.status(401).json({ error: "Access denied." });
      }
      where.branch_id = userBranch;
    }

    const notice = await prisma.notice.findFirst({
      where,
      include: noticeInclude,
    });

    if (!notice) return res.status(404).json({ error: 'Notice not found.' });
    res.status(200).json(notice);
  } catch (err) {
    next(err);
  }
};

// 🟢 POST /api/notices (Create Notice)
const createOne = async (req, res, next) => {
  try {
    const title = req.body.title;
    const description = req.body.description || "";
    const restaurant_id = req.body.restaurant || req.body.restaurant_id;
    const branch_id = req.body.branch || req.body.branch_id;
    const is_active = req.body.is_active;

    if (!restaurant_id || !branch_id) {
      return res.status(400).json({ error: "Restaurant and Branch are required." });
    }

    let imageUrl = null;

    // ✅ Cloudinary Upload (Buffer)
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "kitchenos/notices"
      );
      imageUrl = result.secure_url;
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        description,
        restaurant_id,
        branch_id,
        is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : true,
        image: imageUrl,
      },
      include: noticeInclude,
    });

    emitEvent('notice:created', notice, 'admin');
    res.status(201).json(notice);
  } catch (err) {
    next(err);
  }
};

// 🟢 PUT /api/notices/:id (Update Notice)
const updateOne = async (req, res, next) => {
  try {
    let where = { id: req.params.id };

    if (!isSuperAdmin(req.user)) {
      const userBranch = req.user?.branch_id || req.user?.branch;
      if (!userBranch) {
        return res.status(401).json({ error: "Access denied." });
      }
      where.branch_id = userBranch;
    }

    const existingNotice = await prisma.notice.findFirst({ where });
    if (!existingNotice) return res.status(404).json({ error: 'Notice not found.' });

    let imageUrl = existingNotice.image;

    // Image Upload Logic
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "kitchenos/notices"
      );
      imageUrl = result.secure_url;
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    const restaurant_id = req.body.restaurant || req.body.restaurant_id;
    const branch_id = req.body.branch || req.body.branch_id;

    const updatedNotice = await prisma.notice.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title !== undefined ? req.body.title : existingNotice.title,
        description: req.body.description !== undefined ? req.body.description : existingNotice.description,
        restaurant_id: restaurant_id || existingNotice.restaurant_id,
        branch_id: branch_id || existingNotice.branch_id,
        is_active: req.body.is_active !== undefined 
          ? (req.body.is_active === 'true' || req.body.is_active === true) 
          : existingNotice.is_active,
        image: imageUrl,
      },
      include: noticeInclude,
    });

    emitEvent('notice:updated', updatedNotice, 'admin');
    res.status(200).json(updatedNotice);
  } catch (err) {
    next(err);
  }
};

// 🟢 PATCH /api/notices/:id/seen (Mark Notice as Seen)
const markAsSeen = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "User authentication required." });
    }

    const notice = await prisma.notice.update({
      where: { id: req.params.id },
      data: {
        seenUsers: {
          connect: { id: userId },
        },
      },
      include: noticeInclude,
    });

    if (!notice) return res.status(404).json({ error: 'Notice not found.' });

    emitEvent('notice:seen', { noticeId: notice.id, userId }, 'admin');
    res.status(200).json(notice);
  } catch (err) {
    next(err);
  }
};

// 🟢 DELETE /api/notices/:id (Delete Notice)
const deleteOne = async (req, res, next) => {
  try {
    let where = { id: req.params.id };

    if (!isSuperAdmin(req.user)) {
      const userBranch = req.user?.branch_id || req.user?.branch;
      if (!userBranch) {
        return res.status(401).json({ error: "Access denied." });
      }
      where.branch_id = userBranch;
    }

    const existingNotice = await prisma.notice.findFirst({ where });
    if (!existingNotice) return res.status(404).json({ error: 'Notice not found.' });

    await prisma.notice.delete({
      where: { id: req.params.id },
    });

    emitEvent('notice:deleted', { id: req.params.id }, 'admin');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// GET /api/notices/unseen-count
const getUnseenCount = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const userId = req.user?.id || req.user?._id;

    let where = { is_active: true };

    if (!isSuperAdmin(req.user)) {
      if (!branchId) return res.status(401).json({ error: "Branch not assigned." });
      where.branch_id = branchId;
    }

    // Filter where user has NOT seen the notice
    where.seenUsers = {
      none: { id: userId },
    };

    const count = await prisma.notice.count({ where });
    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
};

// POST /api/notices/mark-seen
const markAllSeen = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const userId = req.user?.id || req.user?._id;

    let where = { is_active: true };

    if (!isSuperAdmin(req.user)) {
      if (!branchId) return res.status(401).json({ error: "Branch not assigned." });
      where.branch_id = branchId;
    }

    where.seenUsers = {
      none: { id: userId },
    };

    const unseenNotices = await prisma.notice.findMany({
      where,
      select: { id: true },
    });

    // Batch connect user to all unseen notices using $transaction
    const updates = unseenNotices.map((notice) =>
      prisma.notice.update({
        where: { id: notice.id },
        data: {
          seenUsers: {
            connect: { id: userId },
          },
        },
      })
    );

    await prisma.$transaction(updates);

    res.status(200).json({
      message: 'All active notices marked as seen.',
      modified: unseenNotices.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  createOne,
  updateOne,
  markAsSeen,
  deleteOne,
  getUnseenCount,
  markAllSeen,
};