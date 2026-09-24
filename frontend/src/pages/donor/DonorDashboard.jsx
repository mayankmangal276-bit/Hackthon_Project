import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Plus,
  PackageCheck,
  Truck,
  Utensils,
  ArrowUpRight,
} from 'lucide-react';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import Countdown from '../../components/Countdown';

export default function DonorDashboard() {
  const { user } = useAuth();

  const [donations, setDonations] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [donationData, analyticsData, shelterData] =
          await Promise.all([
            api.donations(),
            api.donorAnalytics(),
            api.shelters(),
          ]);

        setDonations(donationData || []);
        setAnalytics(analyticsData || {});
        setShelters(shelterData || []);
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError(err.message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function getShelterName(shelterId) {
    if (!shelterId) return 'Not matched';

    const shelter = shelters.find(
      (s) => String(s._id || s.id) === String(shelterId)
    );

    return shelter?.name || 'Matched shelter';
  }

  const donorName =
    user?.name ||
    user?.organization ||
    'Donor';

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-sm font-bold text-leaf">
            DONOR CONTROL CENTER
          </div>

          <h1 className="mt-1 text-4xl font-black">
            Good evening, {donorName}.
          </h1>

          <p className="mt-2 text-slate-500">
            Turn today's surplus into someone's meal.
          </p>
        </div>

        <Link to="/donor/donate" className="btn btn-primary">
          <Plus size={17} />
          Donate Surplus Food
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Food Rescued"
          value={
            loading
              ? '...'
              : `${Number(analytics?.foodRescued || 0).toLocaleString()} kg`
          }
          icon={PackageCheck}
        />

        <StatCard
          label="Active Donations"
          value={
            loading
              ? '...'
              : analytics?.activeDonations ?? 0
          }
          icon={Utensils}
        />

        <StatCard
          label="Successful Deliveries"
          value={
            loading
              ? '...'
              : analytics?.successfulDeliveries ?? 0
          }
          icon={Truck}
        />

        <StatCard
          label="Estimated Meals"
          value={
            loading
              ? '...'
              : Number(analytics?.mealsSaved || 0).toLocaleString()
          }
          icon={Utensils}
        />

      </div>

      {/* Recent Donations */}
      <div className="card mt-8 overflow-hidden">

        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-black">
              Recent donations
            </h2>

            <p className="text-sm text-slate-500">
              Live status across your rescue network.
            </p>
          </div>

          <ArrowUpRight className="text-slate-400" />
        </div>

        <div className="divide-y">

          {loading ? (
            <div className="p-10 text-center text-slate-400">
              Loading your donations...
            </div>
          ) : donations.length ? (

            donations.slice(0, 6).map((donation) => (

              <div
                key={donation._id || donation.id}
                className="grid gap-4 p-5 md:grid-cols-[1.5fr_.7fr_1fr_1fr] md:items-center"
              >

                {/* Food */}
                <div>
                  <div className="font-black">
                    {donation.foodType}
                  </div>

                  <div className="text-sm text-slate-500">
                    {donation.quantity} {donation.unit} ·{' '}
                    {donation.category}
                  </div>
                </div>

                {/* Status */}
                <span className="w-fit rounded-full bg-mint px-3 py-1 text-xs font-black text-leaf">
                  {donation.status}
                </span>

                {/* Countdown */}
                <Countdown expiry={donation.expiryTime} />

                {/* Shelter */}
                <div className="text-sm font-semibold text-slate-500">
                  {getShelterName(donation.matchedShelterId)}
                </div>

              </div>

            ))

          ) : (

            <div className="p-10 text-center">
              <div className="font-bold text-slate-500">
                No donations yet.
              </div>

              <Link
                to="/donor/donate"
                className="mt-3 inline-block text-sm font-bold text-leaf"
              >
                Create your first rescue →
              </Link>
            </div>

          )}

        </div>
      </div>

    </div>
  );
}
