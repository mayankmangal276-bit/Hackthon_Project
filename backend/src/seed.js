import 'dotenv/config';
import mongoose from 'mongoose';
import Shelter from './models/Shelter.js';
import Driver from './models/Driver.js';

const shelters = [
  {
    name: 'Hope Shelter',
    location: { lat: 26.9196, lng: 75.8035, address: 'Jaipur' },
    capacity: 50,
    currentCapacity: 20,
    acceptedFoodTypes: ['Cooked Meal', 'Rice', 'Vegetables', 'ALL'],
    status: 'ACTIVE'
  },
  {
    name: 'Annapurna Food Bank',
    location: { lat: 26.9003, lng: 75.805, address: 'Jaipur' },
    capacity: 80,
    currentCapacity: 45,
    acceptedFoodTypes: ['Cooked Meal', 'Rice', 'ALL'],
    status: 'ACTIVE'
  },
  {
    name: 'Seva Community Kitchen',
    location: { lat: 26.925, lng: 75.775, address: 'Jaipur' },
    capacity: 40,
    currentCapacity: 12,
    acceptedFoodTypes: ['ALL'],
    status: 'ACTIVE'
  },
  {
    name: 'Helping Hands NGO',
    location: { lat: 26.911, lng: 75.790, address: 'Jaipur' },
    capacity: 60,
    currentCapacity: 25,
    acceptedFoodTypes: ['Cooked Meal', 'Vegetables', 'Rice'],
    status: 'ACTIVE'
  },
  {
    name: 'Food For All Center',
    location: { lat: 26.935, lng: 75.800, address: 'Jaipur' },
    capacity: 70,
    currentCapacity: 30,
    acceptedFoodTypes: ['ALL'],
    status: 'ACTIVE'
  },
  {
    name: 'Anand Seva Kendra',
    location: { lat: 26.895, lng: 75.780, address: 'Jaipur' },
    capacity: 45,
    currentCapacity: 10,
    acceptedFoodTypes: ['Rice', 'Cooked Meal'],
    status: 'ACTIVE'
  },
  {
    name: 'Roti Bank Jaipur',
    location: { lat: 26.905, lng: 75.795, address: 'Jaipur' },
    capacity: 55,
    currentCapacity: 18,
    acceptedFoodTypes: ['Cooked Meal', 'Rice', 'Vegetables'],
    status: 'ACTIVE'
  },
  {
    name: 'Sahara Community Shelter',
    location: { lat: 26.930, lng: 75.785, address: 'Jaipur' },
    capacity: 90,
    currentCapacity: 35,
    acceptedFoodTypes: ['ALL'],
    status: 'ACTIVE'
  }
];

const drivers = [
  {
    name: 'Rahul Sharma',
    location: { lat: 26.905, lng: 75.81 },
    availability: true,
    currentAssignment: ''
  },
  {
    name: 'Aman Verma',
    location: { lat: 26.92, lng: 75.79 },
    availability: true,
    currentAssignment: ''
  },
  {
    name: 'Vikram Singh',
    location: { lat: 26.91, lng: 75.77 },
    availability: true,
    currentAssignment: ''
  },
  {
    name: 'Neha Gupta',
    location: { lat: 26.93, lng: 75.80 },
    availability: true,
    currentAssignment: ''
  },
  {
    name: 'Arjun Meena',
    location: { lat: 26.89, lng: 75.79 },
    availability: true,
    currentAssignment: ''
  },
  {
    name: 'Priya Sharma',
    location: { lat: 26.915, lng: 75.785 },
    availability: true,
    currentAssignment: ''
  },
  {
    name: 'Rohit Kumar',
    location: { lat: 26.94, lng: 75.775 },
    availability: true,
    currentAssignment: ''
  },
  {
    name: 'Karan Joshi',
    location: { lat: 26.90, lng: 75.80 },
    availability: true,
    currentAssignment: ''
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');

    for (const shelter of shelters) {
      await Shelter.findOneAndUpdate(
        { name: shelter.name },
        shelter,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    for (const driver of drivers) {
      await Driver.findOneAndUpdate(
        { name: driver.name },
        driver,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`Seeded ${shelters.length} shelters`);
    console.log(`Seeded ${drivers.length} drivers`);

    const shelterCount = await Shelter.countDocuments();
    const driverCount = await Driver.countDocuments();

    console.log('Shelters in MongoDB:', shelterCount);
    console.log('Drivers in MongoDB:', driverCount);

    await mongoose.disconnect();
    console.log('Seed complete');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
