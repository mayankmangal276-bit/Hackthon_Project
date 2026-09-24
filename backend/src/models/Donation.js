import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    donorId: {
      type: String,
      required: true
    },

    foodType: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    unit: {
      type: String,
      default: 'kg'
    },

    location: {
      lat: Number,
      lng: Number,
      address: String
    },

    contact: {
      name: String,
      phone: String
    },

    expiryTime: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: [
        'POSTED',
        'MATCHED',
        'SHELTER_ACCEPTED',
        'DRIVER_ASSIGNED',
        'DRIVER_ACCEPTED',
        'EN_ROUTE_PICKUP',
        'ARRIVED_PICKUP',
        'PICKED_UP',
        'EN_ROUTE_SHELTER',
        'ARRIVED_SHELTER',
        'DELIVERED',
        'EXPIRED',
        'CANCELLED'
      ],
      default: 'POSTED'
    },

    matchedShelterId: String,

    driverId: String,

    description: String,

    createdAt: {
      type: Date,
      default: Date.now
    },

    deliveredAt: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Donation', schema);
