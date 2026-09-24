import { useEffect, useState } from 'react';
import {
  Building2,
  Package,
  Users,
  Clock3,
  CheckCircle2
} from 'lucide-react';

import { api } from '../../services/api';
import StatCard from '../../components/StatCard';

export default function ShelterDashboard() {
  const [profile, setProfile] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [shelter, rescues] = await Promise.all([
          api.shelterProfile(),
          api.shelterIncoming()
        ]);

        setProfile(shelter);
        setIncoming(rescues);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load shelter dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="card p-10 text-center font-bold">
          Loading shelter dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="rounded-2xl bg-red-50 p-6 text-red-600">
          <div className="font-black">Unable to load shelter</div>
          <div className="mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const activeRescues = incoming.filter(
    item =>
      !['DELIVERED', 'CANCELLED', 'SHELTER_REJECTED'].includes(
        item.rescue?.status
      )
  );

  const deliveredRescues = incoming.filter(
    item => item.rescue?.status === 'DELIVERED'
  );

  const mealsServed = Math.round(
    deliveredRescues.reduce(
      (sum, item) => sum + Number(item.donation?.quantity || 0) * 2.8,
      0
    )
  );

  const current = Number(profile.currentCapacity || 0);
  const total = Number(profile.capacity || 0);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">

      {/* HEADER */}
      <div className="text-sm font-bold text-leaf">
        SHELTER INBOX
      </div>

      <h1 className="mt-1 text-4xl font-black">
        {profile.name}
      </h1>

      <p className="mt-2 text-slate-500">
        Know what is arriving before it reaches the kitchen.
      </p>

      {/* STATS */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">

        <StatCard
          label="Current Capacity"
          value={`${current} / ${total} kg`}
          icon={Building2}
        />

        <StatCard
          label="Incoming"
          value={activeRescues.length}
          icon={Package}
        />

        <StatCard
          label="Estimated Meals Served"
          value={mealsServed}
          icon={Users}
        />

      </div>

      {/* FOOD NEEDS */}
      <div className="card mt-8 p-6">

        <h2 className="text-xl font-black">
          Current Food Needs
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Food your shelter currently needs.
        </p>

        {profile.foodNeeds?.filter(need => need.active).length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">

            {profile.foodNeeds
              .filter(need => need.active)
              .map(need => (
                <div
                  key={need._id}
                  className="rounded-2xl bg-cream p-4"
                >

                  <div className="flex items-center justify-between">

                    <div>
                      <div className="font-black">
                        {need.foodType}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        Need {need.requiredQuantity} {need.unit}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        need.priority === 'HIGH'
                          ? 'bg-red-100 text-red-600'
                          : need.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-mint text-leaf'
                      }`}
                    >
                      {need.priority}
                    </span>

                  </div>

                </div>
              ))}

          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-cream p-5 text-sm text-slate-400">
            No food requirements added yet.
          </div>
        )}

      </div>

      {/* INCOMING DONATIONS */}
      <div className="card mt-8 p-6">

        <h2 className="text-xl font-black">
          Incoming donations
        </h2>

        <div className="mt-5 grid gap-4">

          {incoming.length === 0 ? (
            <div className="rounded-2xl bg-cream p-8 text-center text-slate-400">
              No incoming donations yet.
            </div>
          ) : (
            incoming.map(item => {
              const rescue = item.rescue;
              const donation = item.donation;
              const driver = item.driver;

              return (
                <div
                  key={rescue._id}
                  className="flex flex-col gap-4 rounded-2xl bg-cream p-5 md:flex-row md:items-center"
                >

                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-leaf">
                    <Package />
                  </div>

                  <div className="flex-1">

                    <div className="font-black">
                      {donation
                        ? `${donation.quantity} ${donation.unit} ${donation.foodType}`
                        : 'Food donation'}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {donation?.category || 'Food donation'}
                    </div>

                    {driver && (
                      <div className="mt-1 text-sm text-slate-500">
                        Driver: {driver.name}
                      </div>
                    )}

                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <Clock3 size={16} />
                    {rescue.estimatedMinutes
                      ? `${rescue.estimatedMinutes} min`
                      : 'ETA pending'}
                  </div>

                  <span className="w-fit rounded-full bg-mint px-3 py-1 text-xs font-black text-leaf">
                    {rescue.status}
                  </span>

                  {rescue.status === 'DELIVERED' && (
                    <CheckCircle2
                      size={20}
                      className="text-leaf"
                    />
                  )}

                </div>
              );
            })
          )}

        </div>
      </div>

    </div>
  );
}
