const { prisma } = require('../config/dbConnect');
const uploadToCloudinary = require('./cloudinaryUpload');
const { emitEvent } = require('./socket');

const resolveBranch = (req) => {
  if (req.user && req.user.branch) return req.user.branch;
  return req.query.branch || null;
};

// Helper function: Multi-file & Nested FormData parsing
// const processBodyAndFiles = async (req, resource, defaultImageField = 'image') => {
//   const data = { ...req.body };

//   const branch = resolveBranch(req);
//   if (branch) data.branch_id = branch;

//   // 🟢 समाधान: यदि body मा 'branch' String आइरहेको छ भने त्यसलाई Prisma DB मा पठाउनु अघि delete गर्नुहोस्
//   delete data.branch;

//   // 1. Parse nested JSON fields
//   ['salary', 'bankDetails'].forEach((field) => {
//     if (typeof data[field] === 'string') {
//       try {
//         data[field] = JSON.parse(data[field]);
//       } catch (e) {
//         // Ignore if not JSON string
//       }
//     }
//   });

//   const folderName = `kitchenos/${resource || 'general'}`;

//   // 2. uploader.fields(...) (req.files)
//   if (req.files) {
//     for (const fieldname of Object.keys(req.files)) {
//       const fileArray = req.files[fieldname];
//       if (fileArray && fileArray.length > 0) {
//         const file = fileArray[0];
//         const result = await uploadToCloudinary(file.buffer, folderName);

//         if (fieldname === 'accountQrCode') {
//           data.bankDetails = data.bankDetails || {};
//           data.bankDetails.qrCode = result.secure_url;
//         } else {
//           data[fieldname] = result.secure_url;
//         }
//       }
//     }
//   }
//   // 3. uploader.single(...) (req.file)
//   else if (req.file) {
//     const result = await uploadToCloudinary(req.file.buffer, folderName);
//     const targetField = req.file.fieldname || defaultImageField;

//     if (targetField === 'accountQrCode') {
//       data.bankDetails = data.bankDetails || {};
//       data.bankDetails.qrCode = result.secure_url;
//     } else {
//       data[targetField] = result.secure_url;
//     }
//   }

//   return data;
// };


const processBodyAndFiles = async (req, resource, defaultImageField = 'image') => {
  const data = { ...req.body };

  const branch = resolveBranch(req);
  if (branch) data.branch_id = branch;

  // 1. Prisma Relation Field delete गर्नुहोस्
  delete data.branch;

  // 2. Multi-part Form Data बाट आएका Image/QR codes upload गर्ने
  const folderName = `kitchenos/${resource || 'general'}`;
  let uploadedQrCode = null;

  if (req.files) {
    for (const fieldname of Object.keys(req.files)) {
      const fileArray = req.files[fieldname];
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];
        const result = await uploadToCloudinary(file.buffer, folderName);

        if (fieldname === 'accountQrCode') {
          uploadedQrCode = result.secure_url;
        } else {
          data[fieldname] = result.secure_url;
        }
      }
    }
  } else if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, folderName);
    const targetField = req.file.fieldname || defaultImageField;

    if (targetField === 'accountQrCode') {
      uploadedQrCode = result.secure_url;
    } else {
      data[targetField] = result.secure_url;
    }
  }

  // 3. String/JSON Fields Parsing
  ['salary', 'bankDetails'].forEach((field) => {
    if (typeof data[field] === 'string') {
      try {
        data[field] = JSON.parse(data[field]);
      } catch (e) {
        // Ignore if plain string
      }
    }
  });

  // 🟢 4. Salary Mapping
  if (data.salary) {
    data.salary_basic = parseFloat(data.salary.basic) || 0;
    data.salary_allowance = parseFloat(data.salary.allowance) || 0;
    data.salary_deductions = parseFloat(data.salary.deductions) || 0;
    delete data.salary;
  } else {
    if (data.salaryBasic !== undefined) data.salary_basic = parseFloat(data.salaryBasic) || 0;
    if (data.salaryAllowance !== undefined) data.salary_allowance = parseFloat(data.salaryAllowance) || 0;
    if (data.salaryDeductions !== undefined) data.salary_deductions = parseFloat(data.salaryDeductions) || 0;
  }

  // 🟢 5. Bank Details Mapping
  if (data.bankDetails) {
    data.bank_name = data.bankDetails.bankName || data.bank_name || null;
    data.bank_account_name = data.bankDetails.accountName || data.bank_account_name || null;
    data.bank_account_number = data.bankDetails.accountNumber || data.bank_account_number || null;
    data.bank_branch = data.bankDetails.branch || data.bank_branch || null;
    data.bank_qr_code = uploadedQrCode || data.bankDetails.qrCode || null;
    delete data.bankDetails;
  } else if (uploadedQrCode) {
    data.bank_qr_code = uploadedQrCode;
  }

  // 🟢 6. Types & Enum Parsing
  if (data.order !== undefined) {
    data.order = parseInt(data.order, 10) || 1;
  }

  // EmploymentType Enum matching (e.g. "full-time" -> "full_time")
  if (data.employmentType && typeof data.employmentType === 'string') {
    data.employmentType = data.employmentType.replace(/-/g, '_');
  }

  // 🟢 7. Status Enum matching (e.g. "on-leave" -> "on_leave")
  if (data.status && typeof data.status === 'string') {
    data.status = data.status.replace(/-/g, '_');
  }

  // 🟢 8. Date Parsing
  if (data.joinedDate) {
    data.joinedDate = new Date(data.joinedDate);
  }

  return data;
};

// Model Name must match Prisma schema model key (e.g., 'gallery', 'category', etc.)
const getAll = (modelName) => async (req, res, next) => {
  try {
    const branch = resolveBranch(req);
    if (!branch) {
      return res.status(400).json({ error: 'branch is required.' });
    }
    const docs = await prisma[modelName].findMany({
      where: { branch_id: branch },
    });
    res.status(200).json(docs);
  } catch (err) {
    next(err);
  }
};

const getOne = (modelName) => async (req, res, next) => {
  try {
    const branch = resolveBranch(req);
    if (!branch) {
      return res.status(400).json({ error: 'branch is required.' });
    }
    const doc = await prisma[modelName].findFirst({
      where: {
        id: req.params.id,
        branch_id: branch,
      },
    });
    if (!doc) return res.status(404).json({ error: 'Not found or Access denied.' });
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};

const createOne = (modelName, resource, defaultImageField = 'image') => async (req, res, next) => {
  try {
    const data = await processBodyAndFiles(req, resource, defaultImageField);

    const doc = await prisma[modelName].create({
      data,
    });

    emitEvent(`${resource}:created`, doc, 'admin');
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

const updateOne = (modelName, resource, defaultImageField = 'image') => async (req, res, next) => {
  try {
    const branch = resolveBranch(req);
    const existingDoc = await prisma[modelName].findFirst({
      where: {
        id: req.params.id,
        branch_id: branch,
      },
    });

    if (!existingDoc) return res.status(404).json({ error: 'Not found or Access denied.' });

    const data = await processBodyAndFiles(req, resource, defaultImageField);

    const updatedDoc = await prisma[modelName].update({
      where: { id: req.params.id },
      data,
    });

    emitEvent(`${resource}:updated`, updatedDoc, 'admin');
    res.status(200).json(updatedDoc);
  } catch (err) {
    next(err);
  }
};

const deleteOne = (modelName, resource) => async (req, res, next) => {
  try {
    const branch = resolveBranch(req);
    const existingDoc = await prisma[modelName].findFirst({
      where: {
        id: req.params.id,
        branch_id: branch,
      },
    });

    if (!existingDoc) return res.status(404).json({ error: 'Not found or Access denied.' });

    await prisma[modelName].delete({
      where: { id: req.params.id },
    });

    emitEvent(`${resource}:deleted`, { id: req.params.id }, 'admin');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, createOne, updateOne, deleteOne };