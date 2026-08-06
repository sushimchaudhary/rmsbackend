const { prisma } = require('../config/dbConnect');
const uploadToCloudinary = require('../utils/cloudinaryUpload');
const { emitEvent } = require('../utils/socket');

// Helper: Safely parses portions array/JSON string
const parsePortions = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (e) {
      const err = new Error('Invalid JSON string format for portions.');
      err.statusCode = 400;
      throw err;
    }
  }
  return [];
};

// Helper: Target rooms for Menu updates
const getMenuRooms = (branchId) => {
  const rooms = ['admin'];
  if (branchId) {
    rooms.push(`branch_${branchId}`);
  }
  return rooms;
};

// Resolves branch ID
const resolveBranch = (req) => {
  if (req.user) return req.user.branch_id || req.user.branch;
  return req.query.branch || null;
};

// GET /menu/
const getAll = async (req, res, next) => {
  try {
    const branch = resolveBranch(req);
    if (!branch) {
      return res.status(400).json({ error: "branch is required." });
    }

    const items = await prisma.menuItem.findMany({
      where: { branch_id: branch },
      include: {
        category: true,
        portions: true, // 👈 Portions pani fetch garna include gariyo
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
};

// GET /menu/:id
const getOne = async (req, res, next) => {
  try {
    const branch = resolveBranch(req);
    if (!branch) {
      return res.status(400).json({ error: "branch is required." });
    }

    const item = await prisma.menuItem.findFirst({
      where: {
        id: req.params.id,
        branch_id: branch,
      },
      include: {
        category: true,
        portions: true, // 👈 Portions include
      },
    });

    if (!item) return res.status(404).json({ error: 'Not found or Access denied.' });
    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
};

// POST /menu/
const createOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    if (!branchId) {
      return res.status(401).json({ error: "Access denied: Branch not assigned." });
    }

    const portionsData = parsePortions(req.body.portions);

    let imageUrl = req.body.image || null;

    // Cloudinary Upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'kitchenos/menu');
      imageUrl = result.secure_url;
    }

    // Prisma relational insert
    const item = await prisma.menuItem.create({
      data: {
        name: req.body.name,
        category_id: req.body.category || req.body.category_id || null,
        status: req.body.status || 'available',
        image: imageUrl,
        branch_id: branchId,
        // ✅ PostgreSQL/Prisma मा Nested Create logic:
        portions: {
          create: portionsData.map((p) => ({
            portion_name: p.portion_name,
            price: parseFloat(p.price) || 0,
          })),
        },
      },
      include: {
        category: true,
        portions: true, // ✅ Created portions array return gर्छ
      },
    });

    // 🟢 Real-time Socket Broadcast
    const targetRooms = getMenuRooms(branchId);
    emitEvent('menu:created', item, targetRooms);

    res.status(201).json(item);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

// PUT/PATCH /menu/:id
const updateOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    if (!branchId) {
      return res.status(401).json({ error: "Access denied." });
    }

    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: req.params.id,
        branch_id: branchId,
      },
    });

    if (!existingItem) return res.status(404).json({ error: 'Not found or Access denied.' });

    let imageUrl = existingItem.image;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'kitchenos/menu');
      imageUrl = result.secure_url;
    }

    // Portions update logic (पुराना portions हटाएर नयाँ थप्ने):
    const updatePortionsData = req.body.portions
      ? {
          deleteMany: {}, // पुराना Portions Clear गर्ने
          create: parsePortions(req.body.portions).map((p) => ({
            portion_name: p.portion_name,
            price: parseFloat(p.price) || 0,
          })),
        }
      : undefined;

    const updatedItem = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name ?? existingItem.name,
        category_id: req.body.category ?? req.body.category_id ?? existingItem.category_id,
        status: req.body.status ?? existingItem.status,
        image: imageUrl,
        ...(updatePortionsData && { portions: updatePortionsData }),
      },
      include: {
        category: true,
        portions: true,
      },
    });

    // 🟢 Real-time Socket Broadcast
    const targetRooms = getMenuRooms(branchId);
    emitEvent('menu:updated', updatedItem, targetRooms);

    res.status(200).json(updatedItem);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

// DELETE /menu/:id
const deleteOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    if (!branchId) {
      return res.status(401).json({ error: "Access denied." });
    }

    const item = await prisma.menuItem.findFirst({
      where: {
        id: req.params.id,
        branch_id: branchId,
      },
    });

    if (!item) return res.status(404).json({ error: 'Not found or Access denied.' });

    // Delete item (Prisma schema ma onDelete: Cascade bhaye portions auto delete hunchhan)
    await prisma.menuItem.delete({
      where: { id: req.params.id },
    });

    // 🟢 Real-time Socket Broadcast
    const targetRooms = getMenuRooms(branchId);
    emitEvent('menu:deleted', { _id: req.params.id, id: req.params.id }, targetRooms);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, createOne, updateOne, deleteOne };