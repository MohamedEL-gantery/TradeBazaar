const ReviewUser = require('../models/reviewUserModel');
const factory = require('./handlerFactory');

exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.revieweeId) filterObject = { reviewee: req.params.revieweeId };
  req.filterObj = filterObject;
  next();
};

exports.setUserIdToBody = (req, res, next) => {
  //Allow nested routes
  if (!req.body.reviewee) req.body.reviewee = req.params.revieweeId;
  if (!req.body.reviewer) req.body.reviewer = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(ReviewUser);
exports.getReview = factory.getOne(ReviewUser);
exports.createReview = factory.createOne(ReviewUser);
exports.updateReview = factory.updateOne(ReviewUser);
exports.deleteReview = factory.deleteOne(ReviewUser);
