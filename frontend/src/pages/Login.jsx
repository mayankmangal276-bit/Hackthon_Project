import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Store,
  Truck,
  HeartHandshake,
  LogIn
} from 'lucide-react';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DONOR');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      value: 'DONOR',
      label: 'Donor',
      description: 'Restaurant / food business',
      icon: Store
    },
    {
      value: 'SHELTER',
      label: 'Shelter',
      description: 'NGO / food bank',
      icon: HeartHandshake
    },
    {
      value: 'DRIVER',
      label: 'Driver',
      description: 'Volunteer driver',
      icon: Truck
    },
    {
      value: 'ADMIN',
      label: 'Admin',
      description: 'Impact operations',
      icon: ShieldCheck
    }
  ];

  const redirectUser = (userRole) => {
    nav(`/${userRole.toLowerCase()}/dashboard`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);

      if (!user) {
        throw new Error('Invalid login details');
      }

      if (user.role !== role) {
        throw new Error(
          `This account is registered as ${user.role}. Please select the correct role.`
        );
      }

      redirectUser(user.role);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setError('');
    setLoading(true);

    try {
      await demoLogin(demoRole);
      redirectUser(demoRole);
    } catch (err) {
      setError('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((item) => item.value === role);
  const SelectedIcon = selectedRole?.icon || Store;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-cream px-5 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center">

        {/* Branding */}
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-leaf text-white">
              <HeartHandshake size={22} />
            </div>

            <span className="text-2xl font-black text-ink">
              FoodRescue <span className="text-leaf">AI</span>
            </span>
          </div>

          <p className="text-sm text-slate-500">
            Don&apos;t Waste Food. Rescue It.
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl bg-white p-7 shadow-xl"
        >
          <div className="mb-7">
            <h1 className="text-3xl font-black text-ink">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Login to continue your food rescue journey.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-bold text-ink">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-bold text-ink">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-bold text-ink">
                I am a:
              </label>

              <div className="relative">
                <SelectedIcon
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-leaf"
                />

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 font-semibold outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                >
                  {roles.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {selectedRole?.description}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-leaf px-4 py-3.5 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={19} />
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Register */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-leaf hover:underline"
            >
              Register
            </Link>
          </div>
        </motion.div>

        {/* Demo Access */}
        <div className="mt-8 w-full">
          <div className="mb-4 text-center">
            <span className="text-xs font-black tracking-widest text-slate-400">
              QUICK DEMO LOGIN
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {roles.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.value}
                  onClick={() => handleDemoLogin(item.value)}
                  disabled={loading}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-leaf">
                    <Icon size={19} />
                  </div>

                  <div>
                    <div className="text-sm font-black text-ink">
                      {item.label}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Demo access
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
