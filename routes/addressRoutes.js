const express = require('express');
const authController = require('../controllers/authController');
const addressController = require('../controllers/addressController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect, authController.restrictTo('user'));

router
  .route('/')
  .post(addressController.addAddress)
  .get(addressController.getUserAddress);

router.delete('/:addressId', addressController.deleteAddress);

module.exports = router;
