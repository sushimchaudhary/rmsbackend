const { prisma } = require('../config/dbConnect');
const uploadToCloudinary = require('../utils/cloudinaryUpload');
const { emitEvent } = require('../utils/socket');

// GET /slider-images/
const getAll = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id || req.user.branch;

    const docs = await prisma.sliderImage.findMany({
      where: { branch_id: branchId },
      orderBy: { id: 'desc' }, // 👈 createdAt को साटो 'id' वा 'createdAt' दुवै सुरक्षित रूपमा प्रयोग गर्न सकिन्छ
    });

    res.status(200).json(docs);
  } catch (err) {
    next(err);
  }
};

// GET /slider-images/:id
const getOne = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id || req.user.branch;

    const doc = await prisma.sliderImage.findFirst({
      where: {
        id: req.params.id,
        branch_id: branchId,
      },
    });

    if (!doc) return res.status(404).json({ error: 'Slider image not found or Access denied.' });
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};

// POST /slider-images/
// POST /slider-images/
const createOne = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id || req.user.branch;

    // 1️⃣ Photo पठाइएको छ कि छैन चेक गर्ने (Image नभई Create नहोस्)
    if (!req.file && !req.body.image) {
      return res.status(400).json({ error: 'Slider image file is required.' });
    }

    const payload = {
      image: '', // Default empty string
      branch_id: branchId || null,
    };

    // 2️⃣ Cloudinary Upload Logic
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        'kitchenos/sliders'
      );
      payload.image = result.secure_url;
    } else if (req.body.image) {
      payload.image = req.body.image;
    }

    // 3️⃣ DB Insert गर्दा 'image' खाली छैन भन्ने निश्चित गर्ने
    if (!payload.image) {
      return res.status(400).json({ error: 'Failed to process slider image URL.' });
    }

    const doc = await prisma.sliderImage.create({
      data: payload,
    });

    emitEvent('slider:created', doc);
    res.status(201).json(doc);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};
// PUT /slider-images/:id
const updateOne = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id || req.user.branch;

    const existingDoc = await prisma.sliderImage.findFirst({
      where: {
        id: req.params.id,
        branch_id: branchId,
      },
    });

    if (!existingDoc) return res.status(404).json({ error: 'Slider image not found or Access denied.' });

    const updatePayload = { ...req.body };

    // ✅ नयाँ Photo पठाएको छ भने Cloudinary मा Upload गर्ने
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        'kitchenos/sliders'
      );
      
      const targetField = req.file.fieldname || 'image';
      updatePayload[targetField] = result.secure_url;
    }

    const doc = await prisma.sliderImage.update({
      where: { id: req.params.id },
      data: updatePayload,
    });

    emitEvent('slider:updated', doc);
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};

// DELETE /slider-images/:id
const deleteOne = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id || req.user.branch;

    const existingDoc = await prisma.sliderImage.findFirst({
      where: {
        id: req.params.id,
        branch_id: branchId,
      },
    });

    if (!existingDoc) return res.status(404).json({ error: 'Slider image not found or Access denied.' });

    await prisma.sliderImage.delete({
      where: { id: req.params.id },
    });

    emitEvent('slider:deleted', { id: req.params.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
};