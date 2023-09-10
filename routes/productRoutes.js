const express = require('express');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(authController.protect);

// POST /product/234fad4/reviews
// GET /product/234fad4/reviews
router.use('/:productId/reviews', reviewRouter);

router.post(
  '/',
  authController.restrictTo('user'),
  productController.uploadProductPhoto,
  productController.resizeProductPhoto,
  productController.setUserIdToBody,
  productController.createProduct
);

router.use(authController.restrictTo('admin', 'user'));

router.get(
  '/',
  productController.createFilterObj,
  productController.getAllProducts
);

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    productController.uploadProductPhoto,
    productController.resizeProductPhoto,
    productController.updateProduct
  )
  .delete(productController.deleteProduct);

module.exports = router;
