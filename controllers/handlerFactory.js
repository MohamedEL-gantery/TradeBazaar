const Product = require('../models/productModel');
const Review = require('../models/reviewModel');
const ReviewUser = require('../models/reviewUserModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc;
    doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    if (Model == Product) {
      if (req.user.role !== 'admin' && req.user.id != doc.user.id) {
        return next(
          new AppError(
            'You do not have permission to perform this action. This action is only allowed for the owner of this product and admin.',
            401
          )
        );
      }
    }

    if (Model == ReviewUser) {
      if (req.user.role !== 'admin' && req.user.id != doc.reviewer.id) {
        return next(
          new AppError(
            'You do not have permission to perform this action. This action is only allowed for the owner of this review and admin.',
            401
          )
        );
      }
    }

    if (Model == Review) {
      if (req.user.role !== 'admin' && req.user.id != doc.user.id) {
        return next(
          new AppError(
            'You do not have permission to perform this action. This action is only allowed for the owner of this review and admin.',
            401
          )
        );
      }
    }

    await Model.findByIdAndDelete(req.params.id);

    // Trigger "remove" event when update document
    doc.remove({ validateBeforeSave: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc;
    doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    if (Model == Product) {
      if (req.user.role !== 'admin' && req.user.id != doc.user.id) {
        return next(
          new AppError(
            'You do not have permission to perform this action. This action is only allowed for the owner of this product and admin.',
            401
          )
        );
      }
    }

    if (Model == ReviewUser) {
      if (req.user.role !== 'admin' && req.user.id != doc.reviewer.id) {
        return next(
          new AppError(
            'You do not have permission to perform this action. This action is only allowed for the owner of this review and admin.',
            401
          )
        );
      }
    }

    if (Model == Review) {
      if (req.user.role !== 'admin' && req.user.id != doc.user.id) {
        return next(
          new AppError(
            'You do not have permission to perform this action. This action is only allowed for the owner of this review and admin.',
            401
          )
        );
      }
    }

    doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //to return new document
      runValidators: true,
    });

    // Trigger "save" event when update document
    doc.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

exports.getOne = (Model, populationOpt) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populationOpt) {
      query = query.populate(populationOpt);
    }
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model, modelName = '') =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    const documentsCounts = await Model.countDocuments();
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .search(modelName)
      .limitFields()
      .paginate(documentsCounts);

    const { query, paginationResult } = features;
    const doc = await query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      paginationResult,
      data: doc,
    });
  });
