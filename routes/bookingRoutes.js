const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.get(
  '/checkout-session/:cartId',
  authController.restrictTo('user'),
  bookingController.checkoutSession
);

router.get(
  '/',
  authController.restrictTo('user', 'admin'),
  bookingController.filterBookingForLoggedUser,
  bookingController.getAllBookings
);

router
  .route('/:id')
  .get(authController.restrictTo('user', 'admin'), bookingController.getBooking)
  .patch(authController.restrictTo('admin'), bookingController.updateBooking)
  .delete(authController.restrictTo('admin'), bookingController.deleteBooking);

module.exports = router;
