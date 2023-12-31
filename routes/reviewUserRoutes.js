const express = require('express');
const authController = require('../controllers/authController');
const reviewUserController = require('../controllers/reviewUserController');

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route('/')
  .post(
    authController.restrictTo('user'),
    reviewUserController.setUserIdToBody,
    reviewUserController.createReview
  );

router.get(
  '/all',
  reviewUserController.createFilterObj,
  reviewUserController.getAllReviews
);

router
  .route('/:id')
  .get(reviewUserController.getReview)
  .patch(authController.restrictTo('user'), reviewUserController.updateReview)
  .delete(authController.restrictTo('user'), reviewUserController.deleteReview);

module.exports = router;
