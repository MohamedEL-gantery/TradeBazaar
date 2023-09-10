const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
    },
    slug: String,
    photos: {
      type: [String],
      required: [true, 'Please provide product photos'],
    },
    type: {
      type: String,
      required: [true, 'Please provide type'],
      enum: {
        values: [
          'transportation',
          'Property',
          'clothes',
          'electronics',
          'PlayAreas',
          'furniture',
          'sportsEquipment',
          'tools',
          'books',
          'campingGear',
          'musicalInstruments',
          'photographyEquipment',
          'gardenTools',
          'costumes',
        ],
        message: 'type must be one of the predefined values',
      },
    },
    subtype: {
      type: String,
      required: [true, 'Please provide sub-type'],
      enum: [
        'car',
        'bus',
        'miniBus',
        'truck',
        'motocycle',
        'bike',
        'Scooters',
        'yacht',
        'apartments',
        'villa',
        'hotelRooms',
        'chalet',
        'male',
        'female',
        'audioEquipment',
        'lightingEquipment',
        'phone',
        'phoneCase',
        'headphone',
        'bluetoothHeadset',
        'earphone',
        'watch',
        'television',
        'washingMachine',
        'cooker',
        'refrigerator',
        'DeepFreezer',
        'conditioning',
        'fan',
        'heater',
        'broom',
        'vacuumCleaner',
        'phoneCharger',
        'laptop',
        'computer',
        'cameras',
        'tripods',
        'Houseware',
        'playgrounds',
        'waterParks',
        'tureGolfCourse',
        'tennisCourt',
        'PadelTennisCourt',
        'tables',
        'chairs',
        'decor',
        'ball',
        'flyingDiscs',
        'nets',
        'racquets',
        'hammer',
        'drill',
        'shovel',
        'saw',
        'tableSaw',
        'miterSaw',
        'plunger',
        'spade',
        'rake',
        'hoe',
        'actionAndAdventure',
        'Classics',
        'comicBookOrGraphicNovel',
        'detectiveAndMystery',
        'Fantasy',
        'historicalFiction',
        'horror',
        'literaryFiction',
        'sleepingBag',
        'tent',
        'firstAidKit',
        'sleepingPad',
        'headlamp',
        'waterBottle',
        'hammock',
        'flashLight',
        'campStove',
        'hikingBoot',
        'lantern',
        'multitool',
        'campingPillow',
        'campingChair',
        'compass',
        'hikinBackpacks',
        'rope',
        'stove',
        'axe',
        'trekkingPole',
        'hammockCamping',
        'stringInstrument',
        'Piano',
        'Violin',
        'guitar',
        'flute',
        'Percussio',
        'cello',
        'brass',
        'harp',
        'xylophones',
        'woodwind',
        'trumpet',
        'KeyboardInstrument',
        'saxophone',
        'trombone',
        'clarinet',
        'drums',
        'doubleBass',
        'oboe',
        'harmonica',
        'accordion',
        'tuba',
        'bassoon',
        'frenchHorn',
        'cameras',
        'tripods',
        'rake',
        'pruningShears',
        'WheelBarrow',
        'hoe',
        'gardenFork',
        'Spade',
        'wateringCan',
        'shovel',
        'loppers',
        'trowel',
        'gardenHose',
        'hedgeTrimmer',
        'curvedPruningSaw',
        'irrigation',
        'Cultivator',
        'fork',
        'stringTrimmer',
        'gardenHoe',
        'leafBlower',
        'edger',
        'hand',
        'gardenRake',
        'leafRake',
      ],
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    productStatus: {
      type: String,
      enum: {
        values: ['rent', 'sale'],
        message: 'ProductStatus must be rent or sale',
      },
    },
    priceForSale: Number,
    pricePerDay: Number,
    numberOfDays: Number,
    totalPriceForRent: Number,
    new: {
      type: Boolean,
      default: false,
    },
    used: {
      type: Boolean,
      default: true,
    },
    availablity: {
      type: Boolean,
      default: true,
    },
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
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ startLocation: '2dsphere' });

productSchema.pre('save', function (next) {
  if (this.pricePerDay && this.numberOfDays) {
    this.totalPriceForRent = this.pricePerDay * this.numberOfDays;
  }
  next();
});

productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo ratingsAverage ratingsQuantity',
  });
  next();
});

productSchema.pre(/^find/, function (next) {
  // this points to the current query.
  this.find({ availablity: { $ne: false } });
  next();
});

productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
