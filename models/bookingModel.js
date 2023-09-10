const mongoose = require('mongoose');
const validator = require('validator');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to an User'],
  },
  cartItems: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
      },
      priceForSale: Number,
      totalPriceForRent: Number,
    },
  ],
  taxPrice: Number,
  shippingAddress: {
    details: String,
    phone: {
      type: String,
      validate: [validator.isMobilePhone, 'Please Provide A Vaild Phone'],
    },
    city: String,
    postalCode: String,
  },
  totalOrderPrice: {
    type: Number,
  },
  paidAt: Date,
});

bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email photo phoneNumber nationalId',
  }).populate({
    path: 'cartItems.product',
    selcet:
      'name type subType productStatus priceForSale totalPriceForRent user',
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
