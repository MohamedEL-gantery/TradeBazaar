const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const reviewUsserRouter = require('./reviewUserRoutes');
const productRouter = require('./productRoutes');

const router = express.Router();

router.post('/admin', authController.signupForAdmin);

router.post('/signup', authController.signup);

router.post('/verfiySignUp', authController.verifySignUp);

router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);

router.post('/verifyresetcode', authController.verfiyPassword);

// Protect all routes after this middleware
router.use(authController.protect);

// POST /revieweeId/234fd55/reviews
// GET /revieweeId/234fd55/reviews/9487fd55
router.use('/:revieweeId/reviews', reviewUsserRouter);

// POST /product/234fad4/reviews
// GET /product/234fad4/reviews
router.use('/:userId/product', productRouter);

router.patch('/resetPassword', authController.resetPassword);

router.patch('/updateMyPassword', authController.updatePassword);

router.patch(
  '/updateMe',
  userController.getMe,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateUser
);

router.get('/me', userController.getMe, userController.getUser);

router.delete('/deleteMe', userController.deleteMe);

router.get('/', userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(
    authController.restrictTo('admin'),
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateUser
  )
  .delete(authController.restrictTo('admin'), userController.deleteUser);

module.exports = router;
