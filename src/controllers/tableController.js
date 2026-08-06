// १. यदि dbConnect बाट { prisma } नभई direct export छ भने सही Destructure गर्नुहोस्
const prisma = require('../config/dbConnect').prisma || require('../config/dbConnect');
const uploadToCloudinary = require('../utils/cloudinaryUpload');
const { emitEvent } = require('../utils/socket');
const RestaurantTableService = require('../services/restaurantTableService');

const resolveBranch = (req) => {
  if (req.user && req.user.branch) return req.user.branch;
  return req.query.branch || null;
};

const getOne = async (req, res, next) => {
  try {
    const branch = resolveBranch(req);
    if (!branch) {
      return res.status(400).json({ error: "branch is required." });
    }

    const table = await prisma.restaurantTable.findFirst({
      where: {
        id: req.params.id,
        branch_id: branch,
      },
    });

    if (!table) return res.status(404).json({ error: 'Not found or Access denied.' });

    res.status(200).json(table);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const branch = resolveBranch(req);
    if (!branch) {
      return res.status(400).json({ error: "branch is required." });
    }

    const tables = await prisma.restaurantTable.findMany({
      where: { branch_id: branch },
      orderBy: { table_number: 'asc' },
    });

    res.status(200).json(tables);
  } catch (err) {
    next(err);
  }
};

const createOne = async (req, res, next) => {
  try {
    const tableData = {
      table_number: req.body.table_number,
      branch_id: req.user.branch,
    };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'kitchenos/tables');
      const targetField = req.file.fieldname || 'image';
      tableData[targetField] = result.secure_url;
    }

    // ✅ Fix: camelCase model name
    let table = await prisma.restaurantTable.create({
      data: tableData,
    });

    table = await RestaurantTableService.generateQrFor(table);

    emitEvent('table:created', table, 'admin');
    res.status(201).json(table);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Table number already exists in this branch." });
    }
    next(err);
  }
};

const updateOne = async (req, res, next) => {
  try {
    const existingTable = await prisma.restaurantTable.findFirst({
      where: { id: req.params.id, branch_id: req.user.branch },
    });

    if (!existingTable) return res.status(404).json({ error: 'Not found or Access denied.' });

    const numberChanged = req.body.table_number && req.body.table_number !== existingTable.table_number;

    const updateData = {
      table_number: req.body.table_number ?? existingTable.table_number,
    };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'kitchenos/tables');
      const targetField = req.file.fieldname || 'image';
      updateData[targetField] = result.secure_url;
    }

    let updatedTable = await prisma.restaurantTable.update({
      where: { id: req.params.id },
      data: updateData,
    });

    if (numberChanged) {
      updatedTable = await RestaurantTableService.generateQrFor(updatedTable);
    }

    emitEvent('table:updated', updatedTable, 'admin');
    res.status(200).json(updatedTable);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Table number already exists in this branch." });
    }
    next(err);
  }
};

const deleteOne = async (req, res, next) => {
  try {
    const existingTable = await prisma.restaurantTable.findFirst({
      where: { id: req.params.id, branch_id: req.user.branch },
    });

    if (!existingTable) return res.status(404).json({ error: 'Not found or Access denied.' });

    await prisma.restaurantTable.delete({
      where: { id: req.params.id },
    });

    emitEvent('table:deleted', { id: req.params.id }, 'admin');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, createOne, updateOne, deleteOne };