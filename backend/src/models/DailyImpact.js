import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true
    },

    donationsCount: {
      type: Number,
      default: 0
    },

    foodDonatedKg: {
      type: Number,
      default: 0
    },

    foodRescuedKg: {
      type: Number,
      default: 0
    },

    successfulDeliveries: {
      type: Number,
      default: 0
    },

    expiredDonations: {
      type: Number,
      default: 0
    },

    mealsSaved: {
      type: Number,
      default: 0
    },

    co2AvoidedKg: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('DailyImpact', schema);
