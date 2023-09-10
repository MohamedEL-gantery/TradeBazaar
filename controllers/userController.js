const User = require('../models/userModel');
const factory = require('./handlerFactory');
const {
  uploadSinglePhoto,
  uploadToCloudinary,
} = require('../middlewares/uploadImageMiddleware');
const catchAsync = require('../utils/catchAsync');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.uploadUserPhoto = uploadSinglePhoto('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await uploadToCloudinary(req.file);

    req.body.photo = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User, 'reviews');
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
