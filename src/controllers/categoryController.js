const { prisma } = require('../config/dbConnect');
const { emitEvent } = require('../utils/socket');

const resolveBranch = (req) => {
  if (req.user && req.user.branch) return req.user.branch;
  return req.query.branch || null;
};

// GET /categories/
const getAll = async (req, res, next) => {
  try {
    const branchId = resolveBranch(req);
    if (!branchId) {
      return res.status(400).json({ error: "branch is required." });
    }

    const categories = await prisma.category.findMany({
      where: { branch_id: branchId },
      orderBy: { name: 'asc' },
      include: {
        menuItems: {
          where: {
            status: 'available',
            branch_id: branchId,
          },
        },
      },
    });

    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};

// GET /categories/:id
const getOne = async (req, res, next) => {
  try {
    const branchId = resolveBranch(req);
    if (!branchId) {
      return res.status(400).json({ error: "branch is required." });
    }

    const cat = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        branch_id: branchId,
      },
      include: {
        menuItems: {
          where: {
            status: 'available',
            branch_id: branchId,
          },
        },
      },
    });

    if (!cat) return res.status(404).json({ error: 'Category not found or Access denied.' });

    res.status(200).json(cat);
  } catch (err) {
    next(err);
  }
};

// POST /categories/ (staff-only mutation)
const createOne = async (req, res, next) => {
  try {
    const userBranchId = req.user?.branch;

    const cat = await prisma.category.create({
      data: {
        ...req.body,
        branch_id: userBranchId,
      },
    });

    emitEvent('category:created', cat);
    res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
};

// PUT /categories/:id (staff-only mutation)
const updateOne = async (req, res, next) => {
  try {
    const userBranchId = req.user?.branch;

    // Verify existing category & branch access
    const existingCat = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        branch_id: userBranchId,
      },
    });

    if (!existingCat) return res.status(404).json({ error: 'Not found or Access denied.' });

    const updatedCat = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });

    emitEvent('category:updated', updatedCat);
    res.status(200).json(updatedCat);
  } catch (err) {
    next(err);
  }
};

// DELETE /categories/:id (staff-only mutation)
const deleteOne = async (req, res, next) => {
  try {
    const userBranchId = req.user?.branch;

    const existingCat = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        branch_id: userBranchId,
      },
    });

    if (!existingCat) return res.status(404).json({ error: 'Category not found or Access denied.' });

    await prisma.category.delete({
      where: { id: req.params.id },
    });

    emitEvent('category:deleted', { id: req.params.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, createOne, updateOne, deleteOne };