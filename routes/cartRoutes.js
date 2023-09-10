const express = require('express');
const authController = require('../controllers/authController');
const cartController = require('../controllers/cartController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect, authController.restrictTo('user'));

router
  .route('/')
  .post(cartController.addProductToCart)
  .get(cartController.getUserCart)
  .delete(cartController.deleteCart);

router.delete('/:itemId', cartController.deleteSpecificCartItem);

module.exports = router;
