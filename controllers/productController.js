const Product = require('../models/productModel');
const factory = require('./handlerFactory');
const {
  uploadMixOfPhotos,
  uploadToCloudinary,
} = require('../middlewares/uploadImageMiddleware');
const catchAsync = require('../utils/catchAsync');

exports.uploadProductPhoto = uploadMixOfPhotos([
  { name: 'photos', maxCount: 6 },
]);

exports.resizeProductPhoto = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.photos) {
    return next();
  }

  req.body.photos = [];

  await Promise.all(
    req.files.photos.map(async (file, i) => {
      const result = await uploadToCloudinary(file);

      req.body.photos.push(result.secure_url);
    })
  );
  next();
});

exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.userId) filterObject = { user: req.params.userId };
  req.filterObj = filterObject;
  next();
};

exports.setUserIdToBody = (req, res, next) => {
  //Allow nested routes
  if (!req.body.user) req.body.user = req.params.userId;
  next();
};

exports.getAllProducts = factory.getAll(Product, 'Products');
exports.getProduct = factory.getOne(Product, 'reviews');
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);
