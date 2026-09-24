import { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  MapPin,
  Navigation,
  PackageCheck,
  Truck,
  X
} from 'lucide-react';
import { api } from '../../services/api';

const flow = [
  'MATCHED',
  'DRIVER_ASSIGNED',
  'DRIVER_ACCEPTED',
  'EN_ROUTE_PICKUP',
  'ARRIVED_PICKUP',
  'PICKED_UP',
  'EN_ROUTE_SHELTER',
  'ARRIVED_SHELTER',
  'DELIVERED'
];

const nextStatus = {
  MATCHED: 'DRIVER_ACCEPTED',
  DRIVER_ASSIGNED: 'DRIVER_ACCEPTED',
  DRIVER_ACCEPTED: 'EN_ROUTE_PICKUP',
  EN_ROUTE_PICKUP: 'ARRIVED_PICKUP',
  ARRIVED_PICKUP: 'PICKED_UP',
  PICKED_UP: 'EN_ROUTE_SHELTER',
  EN_ROUTE_SHELTER: 'ARRIVED_SHELTER',
  ARRIVED_SHELTER: 'DELIVERED'
};

const buttonText = {
  MATCHED: 'Accept Rescue',
  DRIVER_ASSIGNED: 'Accept Rescue',
  DRIVER_ACCEPTED: 'Start Pickup',
  EN_ROUTE_PICKUP: 'Arrived at Pickup',
  ARRIVED_PICKUP: 'Confirm Food Picked Up',
  PICKED_UP: 'Start Delivery',
  EN_ROUTE_SHELTER: 'Arrived at Shelter',
  ARRIVED_SHELTER: 'Confirm Delivery'
};

function formatStatus(status) {
  return String(status || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function Countdown({ expiry }) {
  const [left, setLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiry).getTime() - Date.now();

      if (diff <= 0) {
        setLeft('Expired');
        return;
      }

      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const m = mins % 60;

      setLeft(hrs > 0 ? `${hrs}h ${m}m left` : `${m}m left`);
    };

    tick();
    const timer = setInterval(tick, 30000);

    return () => clearInterval(timer);
  }, [expiry]);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
      <Clock size={16} />
      {left}
    </div>
  );
}

export default function DriverDashboard() {
  const [rescues, setRescues] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const [r, d] = await Promise.all([
        api.rescues(),
        api.donations()
      ]);

      setRescues(Array.isArray(r) ? r : []);
      setDonations(Array.isArray(d) ? d : []);
    } catch (e) {
      setError(e.message || 'Unable to load driver data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (rescue) => {
    const id = rescue.id || rescue._id;
    const status = nextStatus[rescue.status];

    if (!id || !status) return;

    try {
      setBusy(id);
      setError('');

      let location = {};

      if (
        status === 'ARRIVED_PICKUP' ||
        status === 'ARRIVED_SHELTER'
      ) {
        if (!navigator.geolocation) {
          throw new Error(
            'GPS is not supported by this browser.'
          );
        }

        const position = await new Promise(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              error => {
                if (error.code === 1) {
                  reject(
                    new Error(
                      'Location permission denied. Allow location access for localhost.'
                    )
                  );
                } else if (error.code === 2) {
                  reject(
                    new Error(
                      'Unable to determine your current location.'
                    )
                  );
                } else {
                  reject(
                    new Error(
                      'GPS location request timed out.'
                    )
                  );
                }
              },
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
              }
            );
          }
        );

        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      }

      const updated = await api.updateRescue(
        id,
        status,
        location
      );

      setRescues(current =>
        current.map(item =>
          (item.id || item._id) === id
            ? updated
            : item
        )
      );

    } catch (e) {
      setError(
        e.message || 'Status update failed'
      );
    } finally {
      setBusy('');
    }
  };

  const reject = async (rescue) => {
    const id = rescue.id || rescue._id;

    if (!id) return;

    try {
      setBusy(id);

      const updated = await api.updateRescue(id, 'DRIVER_REJECTED');

      setRescues(current =>
        current.filter(
          item => (item.id || item._id) !== id
        )
      );
    } catch (e) {
      setError(e.message || 'Unable to reject rescue');
    } finally {
      setBusy('');
    }
  };

  const getDonation = rescue =>
    donations.find(
      d => String(d._id || d.id) === String(rescue.donationId)
    );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="text-sm font-bold text-leaf">
        DRIVER CONSOLE
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">
            Rescue runs, not paperwork.
          </h1>

          <p className="mt-2 text-slate-500">
            Accept urgent food pickups and keep every handoff visible.
          </p>
        </div>

        <button
          onClick={load}
          className="btn btn-secondary"
        >
          <Truck size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card mt-8 p-10 text-center text-slate-400">
          Loading rescue assignments...
        </div>
      ) : rescues.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <Truck
            size={42}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 text-xl font-black">
            No rescue assigned yet
          </h2>

          <p className="mt-2 text-slate-400">
            New rescue assignments will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {rescues.map(rescue => {
            const donation = getDonation(rescue);
            const id = rescue.id || rescue._id;
            const currentIndex = flow.indexOf(rescue.status);
            const isDelivered = rescue.status === 'DELIVERED';

            return (
              <div
                key={id}
                className="card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-leaf">
                      ACTIVE RESCUE
                    </div>

                    <h2 className="mt-1 text-xl font-black">
                      {donation?.quantity || 0} kg{' '}
                      {donation?.foodType || 'Food Donation'}
                    </h2>

                    <div className="mt-2 text-sm text-slate-400">
                      {formatStatus(rescue.status)}
                    </div>
                  </div>

                  {donation?.expiryTime && (
                    <Countdown expiry={donation.expiryTime} />
                  )}
                </div>

                <div className="my-6 space-y-4">
                  <div className="flex gap-3">
                    <MapPin
                      className="text-leaf"
                      size={19}
                    />

                    <div>
                      <div className="text-xs text-slate-400">
                        PICKUP
                      </div>

                      <b>
                        {donation?.location?.address ||
                          'Food donor location'}
                      </b>
                    </div>
                  </div>

                  <div className="ml-2 border-l-2 border-dashed border-slate-200 pl-7 text-sm text-slate-400">
                    {rescue.distanceKm
                      ? `${rescue.distanceKm} km`
                      : 'Route assigned'}
                    {rescue.estimatedMinutes
                      ? ` · ~${rescue.estimatedMinutes} min`
                      : ''}
                  </div>

                  <div className="flex gap-3">
                    <Navigation
                      className="text-sky-500"
                      size={19}
                    />

                    <div>
                      <div className="text-xs text-slate-400">
                        DELIVERY
                      </div>

                      <b>
                        {rescue.shelterName ||
                          'Assigned shelter'}
                      </b>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    'DRIVER ASSIGNED',
                    'PICKED UP',
                    'DELIVERED'
                  ].map((label, index) => {
                    const target =
                      index === 0
                        ? 1
                        : index === 1
                        ? 5
                        : 8;

                    const complete =
                      currentIndex >= target;

                    return (
                      <div
                        key={label}
                        className={`rounded-xl p-3 text-center text-xs font-bold ${
                          complete
                            ? 'bg-mint text-leaf'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {complete ? (
                          <Check
                            size={14}
                            className="mx-auto mb-1"
                          />
                        ) : (
                          <Clock
                            size={14}
                            className="mx-auto mb-1"
                          />
                        )}

                        {label}
                      </div>
                    );
                  })}
                </div>

                {!isDelivered && nextStatus[rescue.status] && (
                  <div className="mt-5 flex gap-2">
                    {(rescue.status === 'MATCHED' ||
                      rescue.status === 'DRIVER_ASSIGNED') && (
                      <button
                        onClick={() => reject(rescue)}
                        disabled={busy === id}
                        className="btn btn-secondary"
                      >
                        <X size={17} />
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => update(rescue)}
                      disabled={busy === id}
                      className="btn btn-primary flex-1"
                    >
                      <PackageCheck size={17} />

                      {busy === id
                        ? 'Updating...'
                        : buttonText[rescue.status] ||
                          `Mark ${formatStatus(
                            nextStatus[rescue.status]
                          )}`}
                    </button>
                  </div>
                )}

                {isDelivered && (
                  <div className="mt-5 rounded-xl bg-mint p-4 text-center font-bold text-leaf">
                    <Check
                      size={20}
                      className="mx-auto mb-1"
                    />
                    Food successfully delivered
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
