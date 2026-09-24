import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: String,

    location: {
      lat: Number,
      lng: Number,
      address: String
    },

    availability: {
      type: Boolean,
      default: true
    },

    currentAssignment: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Driver', schema);
