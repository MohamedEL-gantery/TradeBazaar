const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signupForAdmin = catchAsync(async (req, res, next) => {
  const admin = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    nationalId: req.body.nationalId,
    RestCodeSignup: true,
    role: 'admin',
  });
  createSendToken(admin, 201, req, res);
});

exports.signup = catchAsync(async (req, res, next) => {
  // 1) Signup
  let newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    nationalId: req.body.nationalId,
    gender: req.body.gender,
    birthDate: req.body.birthDate,
    phoneNumber: req.body.phoneNumber,
    city: req.body.city,
    location: req.body.location,
  });

  // 2) Generate hash reset random 4 digits and save it in db
  const resetCode = newUser.generateVerificationCode();
  const token = signToken(newUser._id);
  await newUser.save({ validateBeforeSave: false });

  // 3) Send it to newUser's email
  const date = new Date();
  const options = { timeZone: 'Africa/Cairo' };
  const dateString = date.toLocaleString('en-US', options);

  const message = `Hello ${newUser.name},\n Glad to have you. \n We received a request to sign up in ${dateString}. \n ${resetCode} \n Please confirm this code to complete the sign up.\n Once confirmed, you'll be able to log in with your new account`;

  try {
    sendEmail({
      email: newUser.email,
      subject: 'Your verification code (valid for 10 min)',
      message,
    });

    res.status(201).json({
      status: 'success',
      token,
      message: 'Verification Code sent to Email',
    });
  } catch (err) {
    newUser.ResetCode = undefined;
    newUser.ResetExpires = undefined;
    newUser.RestCodeSignup = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.verifySignUp = catchAsync(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');
  // 2) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not sign up! Please sign up to get access.', 401)
    );
  }

  // 3) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 4) Check if user still exists
  let user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if the reset code is valid and not expired
  user = await User.findOne({
    ResetCode: hashedResetCode,
    ResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    await User.findByIdAndDelete(decoded.id);
    return next(new AppError('Reset code is invalid or expired'));
  }

  // 5) Reset code is valid, mark it as verified
  user.ResetCode = undefined;
  user.ResetExpires = undefined;
  user.RestCodeSignup = true;
  user.ResetVerified = undefined;
  await user.save({ validateBeforeSave: false });

  // 6) If everything is ok, generate a new token and send it in the response
  createSendToken(user, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists & password is correct&& resetVerified is true
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  if (user.RestCodeSignup != true) {
    return next(new AppError('this user does not longer exist', 401));
  }

  // 3) If everything ok, send token to clinet.
  createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  // 2) If user exist, Generate hash reset random 4 digits and save it in db
  const resetCode = user.generateVerificationCode();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const date = new Date();
  const options = { timeZone: 'Africa/Cairo' };
  const dateString = date.toLocaleString('en-US', options);

  const message = `Hi ${user.name},\n We received a request to reset the password on your Account in ${dateString}. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.`;

  try {
    sendEmail({
      email: user.email,
      subject: 'Your verification code (valid for 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Verification code sent to email!',
    });
  } catch (err) {
    user.ResetCode = undefined;
    user.ResetExpires = undefined;
    user.ResetVerified = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again '),
      500
    );
  }
});

exports.verfiyPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

  const user = await User.findOne({
    ResetCode: hashedResetCode,
    ResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Reset code invalid or expired', 400));
  }

  // 2) Reset code valid
  user.ResetVerified = true;
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError(`There is no user with that id `, 404));
  }

  // 2) Check if reset code verified
  if (!user.ResetVerified) {
    return next(new AppError('Reset code not verified', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.ResetCode = undefined;
  user.ResetExpires = undefined;
  user.ResetVerified = undefined;

  await user.save();

  // 3) If everything is ok, generate token
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your password Current is wrong.', 401));
  }

  // update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
