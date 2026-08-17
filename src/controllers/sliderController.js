const { prisma } = require('../config/dbConnect');
const uploadToCloudinary = require('../utils/cloudinaryUpload');
const { emitEvent } = require('../utils/socket');

// GET /slider-images/
const getAll = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id || req.user.branch;

    const docs = await prisma.sliderImage.findMany({
      where: { branch_id: branchId },
      orderBy: { id: 'desc' },
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
const createOne = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id || req.user.branch;

    // 1️⃣ Multiple files (req.files) वा single/array image check गर्ने
    const files = req.files || (req.file ? [req.file] : []);
    const bodyImages = req.body.images || req.body.image || [];
    const parsedBodyImages = Array.isArray(bodyImages) ? bodyImages : [bodyImages].filter(Boolean);

    if (files.length === 0 && parsedBodyImages.length === 0) {
      return res.status(400).json({ error: 'Slider image files are required.' });
    }

    let imageUrls = [...parsedBodyImages];

    // 2️⃣ Multiple files हरूलाई Cloudinary मा upload गर्ने
    if (files.length > 0) {
      const uploadPromises = files.map(file =>
        uploadToCloudinary(file.buffer, 'kitchenos/sliders')
      );
      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results.map(result => result.secure_url);
      imageUrls = [...imageUrls, ...uploadedUrls];
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({ error: 'Failed to process slider image URLs.' });
    }

    const doc = await prisma.sliderImage.create({
      data: {
        images: imageUrls, // 👈 Array save हुन्छ
        branch_id: branchId || null,
      },
    });

    emitEvent('slider:created', doc);
    res.status(201).json(doc);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

// PUT /slider-images/:id
// const updateOne = async (req, res, next) => {
//   try {
//     const branchId = req.user.branch_id || req.user.branch;

//     const existingDoc = await prisma.sliderImage.findFirst({
//       where: {
//         id: req.params.id,
//         branch_id: branchId,
//       },
//     });

//     if (!existingDoc) return res.status(404).json({ error: 'Slider image not found or Access denied.' });

//     let updatePayload = { ...req.body };
//     let finalImages = existingDoc.images || [];

//     // यदि नयाঁ images पठाएको छ भने (append वा replace गर्न मिल्ने गरी)
//     if (req.body.images) {
//       finalImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
//     }

//     // ✅ नयाँ Multiple Photos पठाएको छ भने Cloudinary मा Upload गरेर थप्ने वा update गर्ने
//     const files = req.files || (req.file ? [req.file] : []);
//     if (files.length > 0) {
//       const uploadPromises = files.map(file =>
//         uploadToCloudinary(file.buffer, 'kitchenos/sliders')
//       );
//       const results = await Promise.all(uploadPromises);
//       const newUploadedUrls = results.map(result => result.secure_url);
      
//       // यदि नयाँ upload गर्दा पुरानैमा थप्ने हो भने:
//       // finalImages = [...finalImages, ...newUploadedUrls];
//       // वा पूर्ण रूपमा नयाँ मात्र राख्ने हो भने:
//       finalImages = newUploadedUrls;
//     }

//     updatePayload.images = finalImages;
//     delete updatePayload.image; // पुरानो single field हटाइएको

//     const doc = await prisma.sliderImage.update({
//       where: { id: req.params.id },
//       data: updatePayload,
//     });

//     emitEvent('slider:updated', doc);
//     res.status(200).json(doc);
//   } catch (err) {
//     next(err);
//   }
// };

// PUT / slider-images/:id
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

    let finalImages = [];

    // १. Frontend बाट पठाएको पुरानो बायोग्राफी/इमेजेजहरूको लिस्ट लिनुहोस् (यदि JSON वा form-data मा आएको छ भने)
    if (req.body.existingImages) {
      const parsed = JSON.parse(req.body.existingImages);
      finalImages = Array.isArray(parsed) ? parsed : [parsed];
    } else if (req.body.images && Array.isArray(req.body.images)) {
      finalImages = req.body.images;
    } else {
      finalImages = existingDoc.images || [];
    }

    // २. नयाँ फाइलहरू upload गर्ने र अन्तिम array मा जोड्ने
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length > 0) {
      const uploadPromises = files.map(file =>
        uploadToCloudinary(file.buffer, 'kitchenos/sliders')
      );
      const results = await Promise.all(uploadPromises);
      const newUploadedUrls = results.map(result => result.secure_url);
      
      // पुरानो राखेर नयाँ थप्ने वा replace गर्ने
      finalImages = [...finalImages, ...newUploadedUrls];
    }

    const doc = await prisma.sliderImage.update({
      where: { id: req.params.id },
      data: { images: finalImages },
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