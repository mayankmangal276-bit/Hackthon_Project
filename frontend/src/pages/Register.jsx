import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, UserPlus, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const FOOD_TYPES = [
  'Cooked Meal',
  'Rice',
  'Vegetables',
  'Bakery',
  'Produce',
  'Dairy',
  'Other'
];

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    role: 'DONOR',

    address: '',
    lat: '',
    lng: '',
    phone: '',

    capacity: '',
    currentCapacity: '0',

    foodNeeds: [
      {
        foodType: 'Cooked Meal',
        requiredQuantity: '',
        unit: 'kg',
        priority: 'MEDIUM'
      }
    ],

    open: '08:00',
    close: '22:00'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFoodNeedChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      foodNeeds: prev.foodNeeds.map((need, i) =>
        i === index
          ? {
              ...need,
              [field]: value
            }
          : need
      )
    }));
  };

  const addFoodNeed = () => {
    setForm((prev) => ({
      ...prev,
      foodNeeds: [
        ...prev.foodNeeds,
        {
          foodType: 'Rice',
          requiredQuantity: '',
          unit: 'kg',
          priority: 'MEDIUM'
        }
      ]
    }));
  };

  const removeFoodNeed = (index) => {
    setForm((prev) => ({
      ...prev,
      foodNeeds: prev.foodNeeds.filter((_, i) => i !== index)
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (form.role === 'DRIVER') {
      if (!form.phone.trim()) {
        setError('Driver phone number is required.');
        return;
      }

      if (!form.address.trim()) {
        setError('Driver address is required.');
        return;
      }

      if (form.lat === '' || form.lng === '') {
        setError('Driver latitude and longitude are required.');
        return;
      }
    }

    if (form.role === 'SHELTER') {
      if (!form.capacity || Number(form.capacity) <= 0) {
        setError('Please enter a valid total shelter capacity.');
        return;
      }

      if (Number(form.currentCapacity) < 0) {
        setError('Current capacity cannot be negative.');
        return;
      }

      if (
        Number(form.currentCapacity) >
        Number(form.capacity)
      ) {
        setError(
          'Current capacity cannot be greater than total capacity.'
        );
        return;
      }

      if (!form.address.trim()) {
        setError('Shelter address is required.');
        return;
      }

      if (form.lat === '' || form.lng === '') {
        setError(
          'Shelter latitude and longitude are required.'
        );
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        organization: form.organization,
        role: form.role
      };

      if (form.role === 'DRIVER') {
        payload.location = {
          lat: Number(form.lat),
          lng: Number(form.lng),
          address: form.address.trim()
        };

        payload.contact = {
          name: form.name,
          phone: form.phone.trim(),
          email: form.email
        };
      }

      if (form.role === 'SHELTER') {
        const activeNeeds = form.foodNeeds
          .filter(
            (need) =>
              need.foodType &&
              Number(need.requiredQuantity) > 0
          )
          .map((need) => ({
            foodType: need.foodType,
            requiredQuantity: Number(
              need.requiredQuantity
            ),
            unit: need.unit,
            priority: need.priority,
            active: true
          }));

        payload.location = {
          lat: Number(form.lat),
          lng: Number(form.lng),
          address: form.address.trim()
        };

        payload.capacity = Number(form.capacity);

        payload.currentCapacity = Number(
          form.currentCapacity || 0
        );

        payload.foodNeeds = activeNeeds;

        payload.acceptedFoodTypes = [
          ...new Set(
            activeNeeds.map((need) => need.foodType)
          )
        ];

        payload.operatingHours = {
          open: form.open,
          close: form.close
        };

        payload.contact = {
          name: form.name,
          email: form.email
        };
      }

      await api.register(payload);

      nav('/login', {
        state: {
          message:
            'Registration successful. Please login.'
        }
      });

    } catch (err) {
      console.error('Registration error:', err);

      setError(
        err.message || 'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isShelter = form.role === 'SHELTER';

  return (
    <div className="min-h-[calc(100vh-73px)] bg-cream px-5 py-12">
      <div className="mx-auto max-w-2xl">

        {/* Branding */}
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-leaf text-white">
              <HeartHandshake size={22} />
            </div>

            <span className="text-2xl font-black text-ink">
              FoodRescue{' '}
              <span className="text-leaf">AI</span>
            </span>
          </div>

          <p className="text-sm text-slate-500">
            Don&apos;t Waste Food. Rescue It.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white p-7 shadow-xl">

          <div className="mb-7">
            <h1 className="text-3xl font-black text-ink">
              Create account
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Join the FoodRescue AI network.
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="space-y-5"
          >

            {/* Name */}
            <Field label="Full Name">
              <input
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="input"
              />
            </Field>

            {/* Email */}
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input"
              />
            </Field>

            {/* Password */}
            <Field label="Password">
              <input
                name="password"
                type="password"
                required
                minLength="6"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="input"
              />
            </Field>

            {/* Organization */}
            <Field
              label={
                isShelter
                  ? 'Shelter / Organization Name'
                  : 'Organization / Business'
              }
            >
              <input
                name="organization"
                type="text"
                required={isShelter}
                value={form.organization}
                onChange={handleChange}
                placeholder={
                  isShelter
                    ? 'Hope Shelter'
                    : 'Restaurant, company, NGO...'
                }
                className="input"
              />
            </Field>

            {/* Role */}
            <Field label="I am a:">
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input bg-white font-semibold"
              >
                <option value="DONOR">
                  Donor
                </option>

                <option value="SHELTER">
                  Shelter
                </option>

                <option value="DRIVER">
                  Driver
                </option>
              </select>
            </Field>

            {/* DRIVER DETAILS */}
            {form.role === 'DRIVER' && (
              <div className="space-y-5 rounded-2xl border border-sky-200 bg-sky-50 p-5">

                <div>
                  <h2 className="text-xl font-black text-ink">
                    Driver Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your location helps us assign nearby food rescue pickups.
                  </p>
                </div>

                <Field label="Phone Number">
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="input"
                  />
                </Field>

                <Field label="Current Address">
                  <textarea
                    name="address"
                    required
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Jaipur"
                    className="input min-h-20"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Latitude">
                    <input
                      name="lat"
                      type="number"
                      step="any"
                      required
                      value={form.lat}
                      onChange={handleChange}
                      placeholder="26.9124"
                      className="input"
                    />
                  </Field>

                  <Field label="Longitude">
                    <input
                      name="lng"
                      type="number"
                      step="any"
                      required
                      value={form.lng}
                      onChange={handleChange}
                      placeholder="75.7873"
                      className="input"
                    />
                  </Field>
                </div>

              </div>
            )}

            {/* SHELTER DETAILS */}
            {isShelter && (
              <div className="space-y-5 rounded-2xl border border-leaf/20 bg-mint/30 p-5">

                <div>
                  <h2 className="text-xl font-black text-ink">
                    Shelter Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Tell us where you are and what food
                    your shelter currently needs.
                  </p>
                </div>

                {/* Address */}
                <Field label="Shelter Address">
                  <textarea
                    name="address"
                    required
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Complete shelter address"
                    className="input min-h-24"
                  />
                </Field>

                {/* Coordinates */}
                <div className="grid gap-4 sm:grid-cols-2">

                  <Field label="Latitude">
                    <input
                      name="lat"
                      type="number"
                      step="any"
                      required
                      value={form.lat}
                      onChange={handleChange}
                      placeholder="26.9124"
                      className="input"
                    />
                  </Field>

                  <Field label="Longitude">
                    <input
                      name="lng"
                      type="number"
                      step="any"
                      required
                      value={form.lng}
                      onChange={handleChange}
                      placeholder="75.7873"
                      className="input"
                    />
                  </Field>

                </div>

                {/* Capacity */}
                <div className="grid gap-4 sm:grid-cols-2">

                  <Field label="Total Food Capacity (kg)">
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      step="0.1"
                      required
                      value={form.capacity}
                      onChange={handleChange}
                      placeholder="100"
                      className="input"
                    />
                  </Field>

                  <Field label="Current Food Stored (kg)">
                    <input
                      name="currentCapacity"
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.currentCapacity}
                      onChange={handleChange}
                      placeholder="60"
                      className="input"
                    />
                  </Field>

                </div>

                {/* Food Needs */}
                <div>
                  <div className="flex items-center justify-between">

                    <div>
                      <h3 className="font-black">
                        Current Food Needs
                      </h3>

                      <p className="text-xs text-slate-500">
                        What food does the shelter need
                        right now?
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addFoodNeed}
                      className="btn btn-soft"
                    >
                      <Plus size={16} />
                      Add Food
                    </button>

                  </div>

                  <div className="mt-4 space-y-3">

                    {form.foodNeeds.map(
                      (need, index) => (

                        <div
                          key={index}
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >

                          <div className="grid gap-3 sm:grid-cols-2">

                            <Field label="Food Type">
                              <select
                                value={need.foodType}
                                onChange={(e) =>
                                  handleFoodNeedChange(
                                    index,
                                    'foodType',
                                    e.target.value
                                  )
                                }
                                className="input bg-white"
                              >
                                {FOOD_TYPES.map(
                                  (food) => (
                                    <option
                                      key={food}
                                      value={food}
                                    >
                                      {food}
                                    </option>
                                  )
                                )}
                              </select>
                            </Field>

                            <Field label="Required Quantity">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={
                                  need.requiredQuantity
                                }
                                onChange={(e) =>
                                  handleFoodNeedChange(
                                    index,
                                    'requiredQuantity',
                                    e.target.value
                                  )
                                }
                                placeholder="25"
                                className="input"
                              />
                            </Field>

                            <Field label="Unit">
                              <select
                                value={need.unit}
                                onChange={(e) =>
                                  handleFoodNeedChange(
                                    index,
                                    'unit',
                                    e.target.value
                                  )
                                }
                                className="input bg-white"
                              >
                                <option value="kg">
                                  kg
                                </option>

                                <option value="meals">
                                  meals
                                </option>

                                <option value="boxes">
                                  boxes
                                </option>
                              </select>
                            </Field>

                            <Field label="Priority">
                              <select
                                value={need.priority}
                                onChange={(e) =>
                                  handleFoodNeedChange(
                                    index,
                                    'priority',
                                    e.target.value
                                  )
                                }
                                className="input bg-white"
                              >
                                <option value="LOW">
                                  Low
                                </option>

                                <option value="MEDIUM">
                                  Medium
                                </option>

                                <option value="HIGH">
                                  High
                                </option>
                              </select>
                            </Field>

                          </div>

                          {form.foodNeeds.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeFoodNeed(index)
                              }
                              className="mt-3 flex items-center gap-2 text-sm font-bold text-red-500"
                            >
                              <Trash2 size={15} />
                              Remove
                            </button>
                          )}

                        </div>

                      )
                    )}

                  </div>
                </div>

                {/* Operating Hours */}
                <div>

                  <h3 className="mb-3 font-black">
                    Operating Hours
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field label="Opening Time">
                      <input
                        name="open"
                        type="time"
                        value={form.open}
                        onChange={handleChange}
                        className="input"
                      />
                    </Field>

                    <Field label="Closing Time">
                      <input
                        name="close"
                        type="time"
                        value={form.close}
                        onChange={handleChange}
                        className="input"
                      />
                    </Field>

                  </div>

                </div>

              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-leaf px-4 py-3.5 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <UserPlus size={19} />

              {loading
                ? 'Creating account...'
                : isShelter
                  ? 'Register Shelter'
                  : 'Create Account'}
            </button>

          </form>

          {/* Login */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}

            <Link
              to="/login"
              className="font-bold text-leaf hover:underline"
            >
              Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-bold">
      {label}

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}
