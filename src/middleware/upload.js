// const multer = require("multer");

// const storage = multer.memoryStorage();

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 9 * 1024 * 1024,
//   },
// });

// const makeUploader = () => ({
//   single: (fieldName) => (req, res, next) => {
//     upload.single(fieldName)(req, res, (err) => {
//       if (err instanceof multer.MulterError) {
//         if (err.code === "LIMIT_FILE_SIZE") {
//           return res.status(400).json({
//             error: "File is too large! Maximum allowed size is 9MB.",
//           });
//         }

//         return res.status(400).json({
//           error: err.message,
//         });
//       }

//       if (err) {
//         return res.status(500).json({
//           error: err.message,
//         });
//       }

//       next();
//     });
//   },
// });

// module.exports = { makeUploader };



const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 9 * 1024 * 1024,
  },
});

const makeUploader = () => ({
  single: (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File is too large! Maximum allowed size is 9MB.",
          });
        }

        return res.status(400).json({
          error: err.message,
        });
      }

      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      next();
    });
  },

  // 👈 Added fields handler for multiple field uploads (e.g. image + accountQrCode)
  fields: (fieldsArray) => (req, res, next) => {
    upload.fields(fieldsArray)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File is too large! Maximum allowed size is 9MB.",
          });
        }

        return res.status(400).json({
          error: err.message,
        });
      }

      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      next();
    });
  },
});

module.exports = { makeUploader };