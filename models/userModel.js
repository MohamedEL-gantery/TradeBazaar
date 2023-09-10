const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide your password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please provide a vaild passworConfirm'],
      // This only works on create and SAVE !!!
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'Password are not the same',
      },
    },
    nationalId: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          // Check if the national ID is a string of 14 digits
          return /^\d{14}$/.test(value);
        },
        message: 'Invalid Egyptian national ID format',
      },
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female'],
        message: 'Gender must be Male or Female',
      },
    },
    birthDate: {
      type: Date,
      validate: [validator.isDate, 'Please provide a valid birthDate'],
    },
    phoneNumber: {
      type: String,
      validate: [validator.isMobilePhone, 'Please provide a valid phoneNumber'],
    },
    city: String,
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
    },
    photo: String,
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating Must Be Above 1.0'],
      max: [5, 'Rating Must Be Below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
      default: 1,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
      },
    ],
    addresses: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
        },
        alias: String,
        detalis: String,
        phone: {
          type: String,
          validate: [validator.isMobilePhone, 'Please provide a vaild phone'],
        },
        city: String,
        postalCode: String,
      },
    ],
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    passwordChangedAt: Date,
    ResetCode: String,
    ResetExpires: Date,
    ResetVerified: Boolean,
    RestCodeSignup: Boolean,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete  passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  return next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query.
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.generateVerificationCode = function () {
  const restCode = Math.floor(1000 + Math.random() * 9000).toString();
  this.ResetCode = crypto.createHash('sha256').update(restCode).digest('hex');
  this.ResetExpires = Date.now() + 10 * 60 * 1000;
  this.ResetVerified = false;
  this.RestCodeSignup = false;

  return restCode;
};

userSchema.virtual('reviews', {
  ref: 'ReviewUser',
  foreignField: 'reviewee',
  localField: '_id',
});

const User = mongoose.model('User', userSchema);

module.exports = User;
