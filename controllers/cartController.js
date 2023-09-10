const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.addProductToCart = catchAsync(async (req, res, next) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);

  // 1) Get Cart for logged user
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    // create cart fot logged user with product
    cart = await Cart.create({
      user: req.user._id,
      cartItems: [
        {
          product: productId,
          priceForSale: product.priceForSale,
          totalPriceForRent: product.totalPriceForRent,
        },
      ],
    });
  } else {
    // product exist in cart not push product to cart
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex >= 0) {
      // Check if productIndex is greater than or equal to 0
      return next(new AppError('This Product is already in cart'));
    } else {
      // product not exist in cart, push product to cartItems array
      cart.cartItems.push({
        product: productId,
        priceForSale: product.priceForSale,
        totalPriceForRent: product.totalPriceForRent,
      });
    }
  }

  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.priceForSale || item.totalPriceForRent;
  });
  cart.totalCartPrice = totalPrice;
  await cart.save();

  res.status(200).json({
    status: 'success',
    message: 'Product added to cart successfully',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

exports.getUserCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new AppError('No cart found for this user', 404));
  }
  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

exports.deleteSpecificCartItem = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: req.params.itemId } },
    },
    { new: true }
  );

  if (!cart) {
    return next(new AppError(`user cart not found`, 404));
  }

  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.priceForSale || item.totalPriceForRent;
  });
  cart.totalCartPrice = totalPrice;
  await cart.save();

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

exports.deleteCart = catchAsync(async (req, res, next) => {
  await Cart.findOneAndDelete({ user: req.user.id });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
