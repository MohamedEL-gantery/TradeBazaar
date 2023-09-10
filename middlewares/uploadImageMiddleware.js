const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/appError');

const multerOptions = () => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(
        new AppError('Please upload only images with png , jpg , jepg ', 400),
        false
      );
    }
  };

  const maxSize = 5 * 1024 * 1024;

  const upload = multer({
    storage: multerStorage,
    limits: { fileSize: maxSize },
    fileFilter: multerFilter,
  });

  return upload;
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (file) => {
  if (!file || !file.buffer) {
    return Promise.resolve({});
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
      .end(file.buffer);
  });
};

exports.uploadSinglePhoto = (fieldName) => {
  const upload = multerOptions().single(fieldName);

  return async (req, res, next) => {
    upload(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        next(new AppError('photo too large to upload', 400));
      } else if (error) {
        next(error);
      } else {
        try {
          const result = await uploadToCloudinary(req.file);
          req.fileUrl = result.secure_url;
          next();
        } catch (error) {
          next(error);
        }
      }
    });
  };
};

exports.uploadMixOfPhotos = (arrayOfFields) => {
  const upload = multerOptions().fields(arrayOfFields);

  return async (req, res, next) => {
    upload(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        next(new AppError('photo too large to upload', 400));
      } else if (error) {
        next(error);
      } else {
        try {
          const files = req.files || {}; // Check if req.files is defined, default to empty object if undefined
          const promises = arrayOfFields.map((field) => {
            const fieldFiles = files[field.name] || [];
            if (fieldFiles.length === 0) {
              return null; // Skip this field if no files are present
            }
            return uploadToCloudinary(fieldFiles[0]);
          });

          const results = await Promise.all(promises);
          req.fileUrls = results
            .filter((result) => result !== null)
            .map((result) => result.secure_url);
          next();
        } catch (error) {
          next(error);
        }
      }
    });
  };
};

exports.uploadToCloudinary = uploadToCloudinary;
