import mongoose from 'mongoose';

const foodNeedSchema = new mongoose.Schema(
  {
    foodType: {
      type: String,
      required: true,
      trim: true
    },

    requiredQuantity: {
      type: Number,
      required: true,
      min: 0
    },

    unit: {
      type: String,
      default: 'kg'
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  { _id: true }
);

const schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    contact: {
      name: String,
      phone: String,
      email: String
    },

    location: {
      lat: Number,
      lng: Number,
      address: String
    },

    capacity: {
      type: Number,
      required: true,
      min: 0
    },

    currentCapacity: {
      type: Number,
      default: 0,
      min: 0
    },

    foodNeeds: {
      type: [foodNeedSchema],
      default: []
    },

    acceptedFoodTypes: {
      type: [String],
      default: []
    },

    operatingHours: {
      open: String,
      close: String
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Shelter', schema);
