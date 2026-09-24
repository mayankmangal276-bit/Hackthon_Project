import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  MapPin,
  Sparkles,
  Truck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

import { api } from '../services/api';

export default function Matching() {
  const { state } = useLocation();
  const nav = useNavigate();

  const donation = state?.donation;
  const matches = state?.matches || [];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!donation) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center">
        <AlertTriangle className="mx-auto text-red-500" size={40} />

        <h2 className="mt-4 text-2xl font-black">
          No donation selected
        </h2>

        <p className="mt-2 text-slate-500">
          Please create a donation first.
        </p>

        <button
          onClick={() => nav('/donor/donate')}
          className="btn btn-primary mt-5"
        >
          Create Donation
        </button>
      </div>
    );
  }

  const selected = matches[selectedIndex];

  const nextMatch = () => {
    if (!matches.length) return;

    setSelectedIndex(
      (selectedIndex + 1) % matches.length
    );
  };

  const confirm = async () => {
    if (!selected) {
      setError('No shelter match is available.');
      return;
    }

    try {
      setConfirming(true);
      setError('');

      /*
       * Driver assignment happens after shelter selection.
       * Only available drivers are considered.
       */
      const drivers = await api.drivers();

      const availableDrivers = drivers.filter(
        (driver) => driver.availability === true
      );

      if (!availableDrivers.length) {
        setError(
          'No available driver is currently available. Please try again shortly.'
        );
        return;
      }

      const driver = availableDrivers[0];

      await api.confirmMatch({
        donationId: donation._id || donation.id,

        shelterId:
          selected._id ||
          selected.id,

        driverId:
          driver._id ||
          driver.id,

        matchScore: selected.score,

        distanceKm: selected.distance,
      });

      setDone(true);

      setTimeout(() => {
        nav('/donor/dashboard');
      }, 1000);

    } catch (err) {
      console.error('Match confirmation failed:', err);

      setError(
        err.message || 'Unable to confirm rescue match.'
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">

      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mint text-leaf">
          {done ? <Check size={28} /> : <Sparkles />}
        </div>

        <h1 className="mt-5 text-4xl font-black">
          {done
            ? 'Rescue confirmed!'
            : 'Finding the best rescue match...'}
        </h1>

        <p className="mt-3 text-slate-500">
          We score distance, capacity, food compatibility,
          urgency and driver availability.
        </p>
      </div>

      {/* Matching checks */}
      <div className="mx-auto mt-8 max-w-3xl space-y-3">

        {[
          'Checking distance',
          'Checking shelter capacity',
          'Checking food compatibility',
          'Checking urgency',
          'Checking driver availability',
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-mint text-leaf">
              <Check size={16} />
            </span>

            <span className="font-semibold">
              {item}
            </span>

            <span className="ml-auto text-xs font-bold text-leaf">
              COMPLETE
            </span>
          </div>
        ))}

      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto mt-6 flex max-w-3xl items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* No matches */}
      {!selected && (
        <div className="mx-auto mt-8 max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">

          <AlertTriangle
            className="mx-auto text-orange-500"
            size={40}
          />

          <h2 className="mt-4 text-2xl font-black">
            No suitable shelter found
          </h2>

          <p className="mt-2 text-slate-500">
            No shelter currently satisfies the food,
            capacity and availability requirements.
          </p>

          <button
            onClick={() => nav('/donor/dashboard')}
            className="btn btn-soft mt-5"
          >
            Back to Dashboard
          </button>

        </div>
      )}

      {/* Best match */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mx-auto mt-8 max-w-3xl overflow-hidden"
        >

          {/* Match header */}
          <div className="bg-ink p-6 text-white">

            <div className="flex items-start justify-between gap-5">

              <div>

                <div className="text-xs font-bold tracking-wider text-white/50">
                  BEST MATCH FOUND
                </div>

                <h2 className="mt-2 text-3xl font-black">
                  {selected.name}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-white/60">
                  <MapPin size={15} />

                  {selected.distance} km away
                </div>

              </div>

              <div className="rounded-2xl bg-lime px-4 py-3 text-center text-ink">

                <div className="text-xs font-bold">
                  MATCH SCORE
                </div>

                <div className="text-3xl font-black">
                  {selected.score}%
                </div>

              </div>

            </div>
          </div>

          {/* Metrics */}
          <div className="grid gap-4 p-6 sm:grid-cols-3">

            <Metric
              t="Capacity"
              v={`${Math.max(
                0,
                Number(selected.capacity || 0) -
                Number(selected.currentCapacity || 0)
              )} kg available`}
            />

            <Metric
              t="Food match"
              v={`${selected.foodCompatibility || 0}% compatible`}
            />

            <Metric
              t="Urgency"
              v={
                selected.urgency >= 85
                  ? 'HIGH'
                  : selected.urgency >= 65
                    ? 'MEDIUM'
                    : 'LOW'
              }
            />

          </div>

          {/* Explanation */}
          <details className="mx-6 mb-6 rounded-2xl bg-cream p-4">

            <summary className="cursor-pointer font-bold">
              Why this match?
              <ChevronDown
                size={16}
                className="ml-1 inline"
              />
            </summary>

            <div className="mt-3 grid gap-2 text-sm text-slate-600">

              <p>
                ✓ Distance considered in matching
              </p>

              <p>
                ✓ Shelter capacity checked
              </p>

              <p>
                ✓ Food category compatibility checked
              </p>

              <p>
                ✓ Expiry urgency considered
              </p>

              <p>
                ✓ Driver availability considered
              </p>

            </div>

          </details>

          {/* Actions */}
          <div className="flex flex-col gap-3 border-t p-6 sm:flex-row">

            <button
              onClick={confirm}
              disabled={confirming || done}
              className="btn btn-primary flex-1"
            >
              {confirming ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />
                  Assigning Driver...
                </>
              ) : (
                <>
                  <Truck size={17} />
                  Confirm Match & Assign Driver
                </>
              )}
            </button>

            {matches.length > 1 && (
              <button
                onClick={nextMatch}
                disabled={confirming || done}
                className="btn bg-slate-100"
              >
                View Other Matches
              </button>
            )}

          </div>

          {/* Match counter */}
          {matches.length > 1 && (
            <div className="pb-5 text-center text-xs font-semibold text-slate-400">
              Showing match {selectedIndex + 1} of {matches.length}
            </div>
          )}

        </motion.div>
      )}

    </div>
  );
}

function Metric({ t, v }) {
  return (
    <div className="rounded-2xl bg-cream p-4">
      <div className="text-xs font-bold text-slate-400">
        {t}
      </div>

      <div className="mt-1 font-black">
        {v}
      </div>
    </div>
  );
}
