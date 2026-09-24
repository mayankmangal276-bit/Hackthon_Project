import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import User from './models/User.js';
import Donation from './models/Donation.js';
import Shelter from './models/Shelter.js';
import Driver from './models/Driver.js';
import Rescue from './models/Rescue.js';
import Notification from './models/Notification.js';
import DailyImpact from './models/DailyImpact.js';

import { auth } from './middleware/auth.js';
import { matchDonation } from './services/matching.js';
import { demoUsers } from './config/demo.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  })
);

app.use(express.json());

let mem = {
  donations: [],
  shelters: [
    {
      id: 's1',
      name: 'Hope Shelter',
      location: {
        lat: 26.9196,
        lng: 75.8035,
        address: 'Jaipur'
      },
      capacity: 50,
      currentCapacity: 20,
      acceptedFoodTypes: ['Cooked Meal', 'Rice', 'Vegetables', 'ALL'],
      status: 'ACTIVE'
    },
    {
      id: 's2',
      name: 'Annapurna Food Bank',
      location: {
        lat: 26.9003,
        lng: 75.805,
        address: 'Jaipur'
      },
      capacity: 80,
      currentCapacity: 45,
      acceptedFoodTypes: ['Cooked Meal', 'Rice', 'ALL'],
      status: 'ACTIVE'
    },
    {
      id: 's3',
      name: 'Seva Community Kitchen',
      location: {
        lat: 26.925,
        lng: 75.775,
        address: 'Jaipur'
      },
      capacity: 40,
      currentCapacity: 12,
      acceptedFoodTypes: ['ALL'],
      status: 'ACTIVE'
    }
  ],
  drivers: [
    {
      id: 'd1',
      name: 'Rahul Sharma',
      location: {
        lat: 26.905,
        lng: 75.81
      },
      availability: true
    },
    {
      id: 'd2',
      name: 'Aman Verma',
      location: {
        lat: 26.92,
        lng: 75.79
      },
      availability: true
    }
  ],
  rescues: [],
  notifications: []
};

async function db() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected');
    }
  } catch (e) {
    console.log('MongoDB unavailable — using demo memory mode');
  }
}

db();

const id = () => Math.random().toString(36).slice(2, 10);

const isMongo = () => mongoose.connection.readyState === 1;

const todayKey = (date = new Date()) =>
  date.toISOString().slice(0, 10);

const kgValue = (quantity, unit) => {
  if (String(unit || '').toLowerCase() !== 'kg') {
    return 0;
  }

  return Number(quantity || 0);
};

async function updateDailyImpact(date, changes = {}) {
  if (!isMongo()) return;

  const dateKey = todayKey(date);

  await DailyImpact.findOneAndUpdate(
    { date: dateKey },
    {
      $inc: {
        donationsCount: Number(changes.donationsCount || 0),
        foodDonatedKg: Number(changes.foodDonatedKg || 0),
        foodRescuedKg: Number(changes.foodRescuedKg || 0),
        successfulDeliveries: Number(
          changes.successfulDeliveries || 0
        ),
        expiredDonations: Number(
          changes.expiredDonations || 0
        ),
        mealsSaved: Number(changes.mealsSaved || 0),
        co2AvoidedKg: Number(changes.co2AvoidedKg || 0)
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

/* ---------------- HEALTH ---------------- */

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mode: isMongo() ? 'mongo' : 'demo'
  });
});

/* ---------------- AUTH ---------------- */

app.post('/api/auth/demo', async (req, res) => {
  const u =
    demoUsers.find(x => x.role === req.body.role) ||
    demoUsers[0];

  const token = jwt.sign(
    {
      id: u.id,
      name: u.name,
      role: u.role,
      email: u.email
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '2h' }
  );

  res.json({
    token,
    user: u
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      organization,
      role,
      location,
      capacity,
      currentCapacity,
      foodNeeds,
      acceptedFoodTypes,
      operatingHours,
      contact
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Name, email, password and role are required'
      });
    }

    if (!['DONOR', 'SHELTER', 'DRIVER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (!isMongo()) {
      return res.status(201).json({
        message: 'Registered in demo mode'
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const u = await User.create({
      name,
      email,
      password: passwordHash,
      organization,
      role,
      location
    });

    try {
      if (role === 'SHELTER') {
        if (
          !location ||
          location.lat === undefined ||
          location.lng === undefined ||
          !location.address
        ) {
          throw new Error('Shelter location and address are required');
        }

        if (!capacity || Number(capacity) <= 0) {
          throw new Error('Shelter capacity must be greater than 0');
        }

        const needs = Array.isArray(foodNeeds)
          ? foodNeeds
              .filter(
                n =>
                  n.foodType &&
                  Number(n.requiredQuantity) > 0
              )
              .map(n => ({
                foodType: n.foodType,
                requiredQuantity: Number(n.requiredQuantity),
                unit: n.unit || 'kg',
                priority: n.priority || 'MEDIUM',
                active: true
              }))
          : [];

        await Shelter.create({
          userId: String(u._id),
          name: organization || name,
          contact: {
            name: contact?.name || name,
            phone: contact?.phone || '',
            email
          },
          location: {
            lat: Number(location.lat),
            lng: Number(location.lng),
            address: location.address
          },
          capacity: Number(capacity),
          currentCapacity: Number(currentCapacity || 0),
          foodNeeds: needs,
          acceptedFoodTypes:
            acceptedFoodTypes?.length
              ? acceptedFoodTypes
              : [...new Set(needs.map(n => n.foodType))],
          operatingHours: {
            open: operatingHours?.open || '08:00',
            close: operatingHours?.close || '22:00'
          },
          status: 'ACTIVE'
        });
      }

      if (role === 'DRIVER') {
        await Driver.create({
          userId: String(u._id),
          name,
          phone: contact?.phone || '',
          location: location
            ? {
                lat: Number(location.lat),
                lng: Number(location.lng),
                address: location.address || ''
              }
            : {},
          availability: true,
          currentAssignment: ''
        });
      }
    } catch (profileError) {
      await User.findByIdAndDelete(u._id);
      throw profileError;
    }

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role
      }
    });

  } catch (e) {
    console.error('Registration error:', e);

    res.status(400).json({
      message: e.message || 'Registration failed'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (isMongo()) {
    const u = await User.findOne({ email });

    if (
      !u ||
      !(await bcrypt.compare(password, u.password))
    ) {
      return res
        .status(401)
        .json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: u.id,
        name: u.name,
        role: u.role,
        email: u.email
      },
      process.env.JWT_SECRET || 'dev-secret'
    );

    return res.json({
      token,
      user: u
    });
  }

  const u = demoUsers.find(x => x.email === email);

  if (!u) {
    return res
      .status(401)
      .json({
        message: 'Use a demo account in this MVP'
      });
  }

  res.json({
    token: jwt.sign(
      {
        id: u.id,
        name: u.name,
        role: u.role,
        email: u.email
      },
      process.env.JWT_SECRET || 'dev-secret'
    ),
    user: u
  });
});

/* ---------------- DONATIONS ---------------- */

/*
  Important:
  A donor sees only their own donations.
  Shelter/Admin can see broader data later.
*/

app.get('/api/donations', auth, async (req, res) => {
  if (isMongo()) {
    let query = {};

    if (req.user.role === 'DONOR') {
      query = { donorId: req.user.id };
    }

    const donations = await Donation
      .find(query)
      .sort({ createdAt: -1 });

    return res.json(donations);
  }

  if (req.user.role === 'DONOR') {
    return res.json(
      mem.donations.filter(
        d => d.donorId === req.user.id
      )
    );
  }

  res.json(mem.donations);
});


app.post('/api/donations', auth, async (req, res) => {
  const body = {
    ...req.body,
    donorId: req.user.id,
    status: 'POSTED'
  };

  if (isMongo()) {
    const d = await Donation.create(body);

    await updateDailyImpact(new Date(), {
      donationsCount: 1,
      foodDonatedKg: kgValue(
        d.quantity,
        d.unit
      )
    });

    return res.json(d);
  }

  const d = {
    ...body,
    _id: id(),
    id: id(),
    createdAt: new Date().toISOString()
  };

  mem.donations.unshift(d);

  res.json(d);
});


/* ---------------- DONOR ANALYTICS ---------------- */

app.get('/api/analytics/donor', auth, async (req, res) => {
  if (isMongo()) {
    const donations = await Donation.find({
      donorId: req.user.id
    });

    const delivered = donations.filter(
      d => d.status === 'DELIVERED'
    );

    const active = donations.filter(
      d =>
        ![
          'DELIVERED',
          'EXPIRED',
          'CANCELLED'
        ].includes(d.status)
    );

    const expired = donations.filter(
      d => d.status === 'EXPIRED'
    );

    const foodRescued = delivered.reduce(
      (sum, d) =>
        sum + kgValue(d.quantity, d.unit),
      0
    );

    const meals = Math.round(
      foodRescued * 2.8
    );

    const co2 = Number(
      (foodRescued * 2.5).toFixed(1)
    );

    return res.json({
      foodRescued,
      activeDonations: active.length,
      successfulDeliveries: delivered.length,
      mealsSaved: meals,
      expiredDonations: expired.length,
      co2AvoidedKg: co2,
      totalDonations: donations.length
    });
  }

  const donations = mem.donations.filter(
    d => d.donorId === req.user.id
  );

  const delivered = donations.filter(
    d => d.status === 'DELIVERED'
  );

  const foodRescued = delivered.reduce(
    (sum, d) =>
      sum + kgValue(d.quantity, d.unit),
    0
  );

  res.json({
    foodRescued,
    activeDonations: donations.filter(
      d =>
        !['DELIVERED', 'EXPIRED'].includes(
          d.status
        )
    ).length,
    successfulDeliveries: delivered.length,
    mealsSaved: Math.round(foodRescued * 2.8),
    expiredDonations: donations.filter(
      d => d.status === 'EXPIRED'
    ).length,
    co2AvoidedKg: Number(
      (foodRescued * 2.5).toFixed(1)
    ),
    totalDonations: donations.length
  });
});


/* ---------------- SHELTERS / DRIVERS ---------------- */

app.get('/api/shelters', auth, async (req, res) => {
  if (isMongo()) {
    return res.json(
      await Shelter.find({
        status: 'ACTIVE'
      })
    );
  }

  res.json(mem.shelters);
});


/* ---------------- LOGGED-IN SHELTER ---------------- */

app.get('/api/shelter/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'SHELTER') {
      return res.status(403).json({
        message: 'Shelter access required'
      });
    }

    let shelter = await Shelter.findOne({
      userId: String(req.user.id)
    });

    // Existing shelter users created before Shelter profiles
    // were introduced are automatically provisioned.
    if (!shelter) {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      shelter = await Shelter.create({
        userId: String(user._id),
        name: user.organization || user.name,
        contact: {
          name: user.name,
          email: user.email
        },
        location: user.location || {},
        capacity: 100,
        currentCapacity: 0,
        foodNeeds: [],
        acceptedFoodTypes: [],
        operatingHours: {},
        status: 'ACTIVE'
      });
    }

    return res.json(shelter);
  } catch (error) {
    console.error('Shelter profile error:', error);

    return res.status(500).json({
      message: error.message
    });
  }
});


app.get('/api/shelter/incoming', auth, async (req, res) => {
  try {
    if (req.user.role !== 'SHELTER') {
      return res.status(403).json({
        message: 'Shelter access required'
      });
    }

    const shelter = await Shelter.findOne({
      userId: String(req.user.id)
    });

    if (!shelter) {
      return res.status(404).json({
        message: 'Shelter profile not found'
      });
    }

    const rescues = await Rescue.find({
      shelterId: String(shelter._id)
    }).sort({ createdAt: -1 });

    const result = [];

    for (const rescue of rescues) {
      const donation = await Donation.findById(
        rescue.donationId
      );

      const driver = rescue.driverId
        ? await Driver.findById(rescue.driverId)
        : null;

      result.push({
        rescue,
        donation,
        driver
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Shelter incoming error:', error);

    return res.status(500).json({
      message: error.message
    });
  }
});


app.get('/api/drivers', auth, async (req, res) => {
  if (isMongo()) {
    return res.json(
      await Driver.find({
        availability: true
      })
    );
  }

  res.json(
    mem.drivers.filter(d => d.availability)
  );
});


/* ---------------- MATCHING ---------------- */

app.post('/api/matching/find', auth, async (req, res) => {
  const donation = isMongo()
    ? await Donation.findById(req.body.donationId)
    : mem.donations.find(
        d =>
          d._id === req.body.donationId ||
          d.id === req.body.donationId
      );

  if (!donation) {
    return res
      .status(404)
      .json({
        message: 'Donation not found'
      });
  }

  if (
    new Date(donation.expiryTime) <=
    new Date()
  ) {
    if (isMongo()) {
      await Donation.findByIdAndUpdate(
        donation._id,
        { status: 'EXPIRED' }
      );
    }

    return res
      .status(400)
      .json({
        message: 'This donation has expired'
      });
  }

  const shelters = isMongo()
    ? await Shelter.find({
        status: 'ACTIVE'
      })
    : mem.shelters;

  const drivers = isMongo()
    ? await Driver.find({
        availability: true
      })
    : mem.drivers.filter(
        d => d.availability
      );

  res.json(
    matchDonation(
      donation,
      shelters,
      drivers
    )
  );
});


app.post('/api/matching/confirm', auth, async (req, res) => {
  const {
    donationId,
    shelterId,
    driverId,
    matchScore
  } = req.body;

  if (isMongo()) {
    const donation = await Donation.findOne({
      _id: donationId,
      donorId: req.user.id
    });

    if (!donation) {
      return res
        .status(404)
        .json({
          message: 'Donation not found'
        });
    }

    await Donation.findByIdAndUpdate(
      donationId,
      {
        status: 'DRIVER_ASSIGNED',
        matchedShelterId: shelterId,
        driverId
      }
    );

    await Driver.findByIdAndUpdate(
      driverId,
      {
        availability: false,
        currentAssignment: donationId
      }
    );

    const r = await Rescue.create({
      donationId,
      donorId: req.user.id,
      shelterId,
      driverId,
      matchScore,
      status: 'DRIVER_ASSIGNED',
      matchedAt: new Date(),
      driverAssignedAt: new Date()
    });

    return res.json(r);
  }

  const d = mem.donations.find(
    x =>
      x._id === donationId ||
      x.id === donationId
  );

  if (d) {
    d.status = 'DRIVER_ASSIGNED';
    d.matchedShelterId = shelterId;
    d.driverId = driverId;
  }

  const r = {
    id: id(),
    donationId,
    shelterId,
    driverId,
    matchScore,
    status: 'DRIVER_ASSIGNED'
  };

  mem.rescues.push(r);

  res.json(r);
});


/* ---------------- RESCUES ---------------- */

app.get('/api/rescues', auth, async (req, res) => {
  if (isMongo()) {
    let query = {};

    if (req.user.role === 'DONOR') {
      query = { donorId: req.user.id };
    }

    if (req.user.role === 'DRIVER') {
      const driver = await Driver.findOne({
        userId: String(req.user.id)
      });

      query = {
        driverId: driver
          ? String(driver._id)
          : '__NO_DRIVER__'
      };
    }

    if (req.user.role === 'SHELTER') {
      const shelter = await Shelter.findOne({
        userId: String(req.user.id)
      });

      query = {
        shelterId: shelter
          ? String(shelter._id)
          : '__NO_SHELTER__'
      };
    }

    return res.json(
      await Rescue.find(query)
        .sort({ createdAt: -1 })
    );
  }

  res.json(mem.rescues);
});


/* ---------------- RESCUE STATUS ---------------- */

const distanceKm = (a, b) => {
  if (
    !a ||
    !b ||
    a.lat === undefined ||
    a.lng === undefined ||
    b.lat === undefined ||
    b.lng === undefined
  ) {
    return Infinity;
  }

  const R = 6371;
  const rad = x => x * Math.PI / 180;

  const dLat = rad(Number(b.lat) - Number(a.lat));
  const dLng = rad(Number(b.lng) - Number(a.lng));

  const q =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(Number(a.lat))) *
      Math.cos(rad(Number(b.lat))) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(q));
};


/* ---------------- RESCUE STATUS ---------------- */

app.patch(
  '/api/rescues/:id/status',
  auth,
  async (req, res) => {
    const { status, latitude, longitude } = req.body;

    const allowedStatuses = [
      'DRIVER_ACCEPTED',
      'EN_ROUTE_PICKUP',
      'ARRIVED_PICKUP',
      'PICKED_UP',
      'EN_ROUTE_SHELTER',
      'ARRIVED_SHELTER',
      'DELIVERED'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid rescue status'
      });
    }

    if (!isMongo()) {
      return res.status(400).json({
        message: 'GPS rescue workflow requires MongoDB mode'
      });
    }

    try {
      const rescue = await Rescue.findById(req.params.id);

      if (!rescue) {
        return res.status(404).json({
          message: 'Rescue not found'
        });
      }

      /* DRIVER OWNERSHIP CHECK */

      const driver = await Driver.findById(rescue.driverId);

      if (!driver) {
        return res.status(404).json({
          message: 'Assigned driver not found'
        });
      }

      if (
        req.user?.role === 'DRIVER' &&
        String(driver.userId) !== String(req.user.id)
      ) {
        return res.status(403).json({
          message: 'This rescue is not assigned to you'
        });
      }

      /* STATUS ORDER CHECK */

      const nextAllowed = {
        MATCHED: ['DRIVER_ACCEPTED'],
        DRIVER_ASSIGNED: ['DRIVER_ACCEPTED'],
        DRIVER_ACCEPTED: ['EN_ROUTE_PICKUP'],
        EN_ROUTE_PICKUP: ['ARRIVED_PICKUP'],
        ARRIVED_PICKUP: ['PICKED_UP'],
        PICKED_UP: ['EN_ROUTE_SHELTER'],
        EN_ROUTE_SHELTER: ['ARRIVED_SHELTER'],
        ARRIVED_SHELTER: ['DELIVERED'],
        DELIVERED: []
      };

      const allowedNext = nextAllowed[rescue.status] || [];

      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          message:
            `Cannot change status from ${rescue.status} to ${status}`
        });
      }

      /* GPS IS REQUIRED ONLY WHEN ARRIVING */

      const needsGps =
        status === 'ARRIVED_PICKUP' ||
        status === 'ARRIVED_SHELTER';

      if (
        needsGps &&
        (
          latitude === undefined ||
          longitude === undefined
        )
      ) {
        return res.status(400).json({
          message: 'GPS location is required for arrival verification'
        });
      }

      const donation = await Donation.findById(
        rescue.donationId
      );

      if (!donation) {
        return res.status(404).json({
          message: 'Donation not found'
        });
      }

      /* PICKUP LOCATION CHECK */

      if (status === 'ARRIVED_PICKUP') {
        const distance = distanceKm(
          {
            lat: Number(latitude),
            lng: Number(longitude)
          },
          donation.location
        );

        if (distance > 0.5) {
          return res.status(400).json({
            message:
              `You are ${distance.toFixed(2)} km away from pickup. Move within 500 meters.`
          });
        }
      }

      /* SHELTER LOCATION CHECK */

      if (status === 'ARRIVED_SHELTER') {
        const shelter = await Shelter.findById(
          rescue.shelterId
        );

        if (!shelter) {
          return res.status(404).json({
            message: 'Shelter not found'
          });
        }

        const distance = distanceKm(
          {
            lat: Number(latitude),
            lng: Number(longitude)
          },
          shelter.location
        );

        if (distance > 0.5) {
          return res.status(400).json({
            message:
              `You are ${distance.toFixed(2)} km away from shelter. Move within 500 meters.`
          });
        }
      }

      const now = new Date();

      const timestamps = {};

      if (status === 'DRIVER_ACCEPTED') {
        timestamps.driverAcceptedAt = now;
      }

      if (status === 'ARRIVED_PICKUP') {
        timestamps.arrivedPickupAt = now;
      }

      if (status === 'PICKED_UP') {
        timestamps.pickedUpAt = now;
      }

      if (status === 'EN_ROUTE_SHELTER') {
        timestamps.enRouteShelterAt = now;
      }

      if (status === 'ARRIVED_SHELTER') {
        timestamps.arrivedShelterAt = now;
      }

      if (status === 'DELIVERED') {
        timestamps.deliveredAt = now;
      }

      const updated = await Rescue.findByIdAndUpdate(
        req.params.id,
        {
          status,
          ...timestamps
        },
        { new: true }
      );

      await Donation.findByIdAndUpdate(
        rescue.donationId,
        {
          status,
          ...(status === 'DELIVERED'
            ? { deliveredAt: now }
            : {})
        }
      );

      /* DELIVERY COMPLETE */

      if (status === 'DELIVERED') {
        await Driver.findByIdAndUpdate(
          rescue.driverId,
          {
            availability: true,
            currentAssignment: ''
          }
        );

        /*
          Add rescued food to shelter capacity.
        */

        const shelter = await Shelter.findById(
          rescue.shelterId
        );

        if (shelter) {
          const rescuedKg = kgValue(
            donation.quantity,
            donation.unit
          );

          shelter.currentCapacity =
            Math.min(
              Number(shelter.capacity || 0),
              Number(shelter.currentCapacity || 0) +
                rescuedKg
            );

          await shelter.save();
        }

        const rescuedKg = kgValue(
          donation.quantity,
          donation.unit
        );

        const meals = Math.round(
          rescuedKg * 2.8
        );

        const co2 = Number(
          (rescuedKg * 2.5).toFixed(1)
        );

        await updateDailyImpact(now, {
          foodRescuedKg: rescuedKg,
          successfulDeliveries: 1,
          mealsSaved: meals,
          co2AvoidedKg: co2
        });
      }

      return res.json(updated);

    } catch (error) {
      console.error('Rescue status error:', error);

      return res.status(500).json({
        message: error.message || 'Unable to update rescue status'
      });
    }
  }
);


/* ---------------- NOTIFICATIONS ---------------- */

app.get(
  '/api/notifications',
  auth,
  async (req, res) => {
    res.json(
      mem.notifications.filter(
        n =>
          n.userId === req.user.id ||
          req.user.role === 'ADMIN'
      )
    );
  }
);


/* ---------------- REAL IMPACT ---------------- */

app.get(
  '/api/analytics/impact',
  auth,
  async (req, res) => {
    if (isMongo()) {
      const donations =
        await Donation.find();

      const delivered =
        donations.filter(
          d => d.status === 'DELIVERED'
        );

      const foodRescued =
        delivered.reduce(
          (sum, d) =>
            sum +
            kgValue(
              d.quantity,
              d.unit
            ),
          0
        );

      const meals = Math.round(
        foodRescued * 2.8
      );

      const co2 = Number(
        (foodRescued * 2.5).toFixed(1)
      );

      res.json({
        foodRescued,
        meals,
        donations: donations.length,
        deliveries: delivered.length,
        co2,
        active: donations.filter(
          d =>
            ![
              'DELIVERED',
              'EXPIRED',
              'CANCELLED'
            ].includes(d.status)
        ).length
      });

      return;
    }

    const donations = mem.donations;

    const delivered =
      donations.filter(
        d => d.status === 'DELIVERED'
      );

    const foodRescued =
      delivered.reduce(
        (sum, d) =>
          sum +
          kgValue(
            d.quantity,
            d.unit
          ),
        0
      );

    res.json({
      foodRescued,
      meals: Math.round(
        foodRescued * 2.8
      ),
      donations: donations.length,
      deliveries: delivered.length,
      co2: Number(
        (foodRescued * 2.5).toFixed(1)
      ),
      active: donations.filter(
        d =>
          ![
            'DELIVERED',
            'EXPIRED',
            'CANCELLED'
          ].includes(d.status)
      ).length
    });
  }
);


/* ---------------- DAILY ANALYTICS ---------------- */

app.get(
  '/api/analytics/daily',
  auth,
  async (req, res) => {
    if (!isMongo()) {
      return res.json([]);
    }

    const days = Number(
      req.query.days || 7
    );

    const rows =
      await DailyImpact.find()
        .sort({ date: -1 })
        .limit(days);

    res.json(
      rows.reverse()
    );
  }
);


/* ---------------- ADMIN DASHBOARD ---------------- */

app.get(
  '/api/analytics/dashboard',
  auth,
  async (req, res) => {
    if (!isMongo()) {
      return res.json({
        foodRescued: [],
        categories: [],
        status: [],
        areas: []
      });
    }

    const donations =
      await Donation.find();

    const daily =
      await DailyImpact.find()
        .sort({ date: -1 })
        .limit(7);

    const categoriesMap = {};

    donations.forEach(d => {
      const category =
        d.category || 'Other';

      categoriesMap[category] =
        (categoriesMap[category] || 0) +
        1;
    });

    const statusMap = {};

    donations.forEach(d => {
      statusMap[d.status] =
        (statusMap[d.status] || 0) +
        1;
    });

    const areasMap = {};

    donations.forEach(d => {
      const area =
        d.location?.address ||
        'Unknown';

      areasMap[area] =
        (areasMap[area] || 0) +
        1;
    });

    res.json({
      foodRescued: daily
        .reverse()
        .map(d => ({
          day: d.date,
          kg: d.foodRescuedKg
        })),

      categories: Object.entries(
        categoriesMap
      ).map(
        ([name, value]) => ({
          name,
          value
        })
      ),

      status: Object.entries(
        statusMap
      ).map(
        ([name, value]) => ({
          name,
          value
        })
      ),

      areas: Object.entries(
        areasMap
      ).map(
        ([name, value]) => ({
          name,
          value
        })
      )
    });
  }
);


/* ---------------- AI EXTRACTION ---------------- */

app.post(
  '/api/ai/extract',
  auth,
  (req, res) => {
    const text =
      String(req.body.text || '');

    const kg =
      text.match(
        /(\d+(?:\.\d+)?)\s*kg/i
      )?.[1] || '10';

    const hours =
      text.match(
        /(\d+)\s*(?:hours?|hrs?)/i
      )?.[1] || '3';

    const category =
      /rice/i.test(text)
        ? 'Rice'
        : /vegetable/i.test(text)
          ? 'Vegetables'
          : 'Cooked Meal';

    res.json({
      foodType:
        /rice/i.test(text)
          ? 'Rice + Vegetables'
          : 'Cooked Meal',

      quantity: Number(kg),

      unit: 'kg',

      category,

      safeWindowHours:
        Number(hours),

      message:
        'Extracted using Rescue AI fallback.'
    });
  }
);


/* ---------------- DEMO RESET ---------------- */

app.post(
  '/api/demo/reset',
  auth,
  (req, res) => {
    mem.donations = [];
    mem.rescues = [];

    res.json({
      ok: true
    });
  }
);


/* ---------------- ERROR ---------------- */

app.use(
  (err, req, res, next) => {
    console.error(err);

    res.status(500).json({
      message: 'Server error'
    });
  }
);


/* ---------------- SERVER ---------------- */

const port =
  process.env.PORT || 5000;

app.listen(
  port,
  () =>
    console.log(
      `FoodRescue backend running on ${port}`
    )
);
