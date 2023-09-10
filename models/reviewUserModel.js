const mongoose = require('mongoose');
const User = require('./userModel');

const reviewUserSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cant not be embty'],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      required: [true, 'Rating can not be empty'],
    },
    reviewee: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to reviewee'],
    },
    reviewer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to reviewer'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewUserSchema.index({ reviewee: 1, reviewer: 1 }, { unique: true });

reviewUserSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'reviewer',
    select: 'name photo',
  });
  next();
});

reviewUserSchema.statics.calcAverageRatings = async function (revieweeId) {
  const stats = await this.aggregate([
    {
      $match: { reviewee: revieweeId },
    },
    {
      $group: {
        _id: '$reviewee',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(revieweeId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await User.findByIdAndUpdate(revieweeId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

reviewUserSchema.post('save', async function () {
  // this point to current review
  await this.constructor.calcAverageRatings(this.reviewee);
});

reviewUserSchema.post('remove', async function () {
  await this.constructor.calcAverageRatings(this.reviewee);
});

const ReviewUser = mongoose.model('ReviewUser', reviewUserSchema);

module.exports = ReviewUser;
