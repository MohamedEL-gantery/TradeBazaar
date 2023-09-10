const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.addAddress = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $addToSet: { addresses: req.body },
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: 'success',
    message: 'address added successfully',
    data: user.addresses,
  });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: { addresses: { _id: req.params.addressId } },
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: 'success',
    message: 'address removed successfully',
    data: user.addresses,
  });
});

exports.getUserAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('addresses');

  res.status(200).json({
    status: 'success',
    results: user.addresses.length,
    data: user.addresses,
  });
});
