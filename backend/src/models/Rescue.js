import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    donationId: {
      type: String,
      required: true
    },

    donorId: {
      type: String,
      required: true
    },

    shelterId: {
      type: String,
      required: true
    },

    driverId: {
      type: String
    },

    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },

    distanceKm: {
      type: Number,
      default: 0
    },

    estimatedMinutes: {
      type: Number,
      default: 0
    },

    shelterResponse: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    },

    driverResponse: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    },

    status: {
      type: String,
      enum: [
        'MATCHED',
        'SHELTER_ACCEPTED',
        'SHELTER_REJECTED',
        'DRIVER_ASSIGNED',
        'DRIVER_ACCEPTED',
        'DRIVER_REJECTED',
        'EN_ROUTE_PICKUP',
        'ARRIVED_PICKUP',
        'PICKED_UP',
        'EN_ROUTE_SHELTER',
        'ARRIVED_SHELTER',
        'DELIVERED',
        'CANCELLED'
      ],
      default: 'MATCHED'
    },

    matchedAt: Date,
    shelterAcceptedAt: Date,
    driverAssignedAt: Date,
    driverAcceptedAt: Date,
    arrivedPickupAt: Date,
    pickedUpAt: Date,
    enRouteShelterAt: Date,
    arrivedShelterAt: Date,
    deliveredAt: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Rescue', schema);
