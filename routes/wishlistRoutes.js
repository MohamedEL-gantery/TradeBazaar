const express = require('express');
const authController = require('../controllers/authController');
const wishListController = require('../controllers/wishListController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect, authController.restrictTo('user'));

router
  .route('/')
  .post(wishListController.addProductToWishList)
  .get(wishListController.getAllWishlistToUser);

router.delete('/:productId', wishListController.deleteProductFromWishList);

module.exports = router;
