import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import DonorDashboard from './pages/donor/DonorDashboard';
import CreateDonation from './pages/donor/CreateDonation';

import ShelterDashboard from './pages/shelter/ShelterDashboard';

import DriverDashboard from './pages/driver/DriverDashboard';

import AdminDashboard from './pages/admin/AdminDashboard';

import Matching from './pages/Matching';
import Impact from './pages/Impact';
import MapPage from './pages/MapPage';

import './index.css';

function Guard({ role, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={`/${user.role.toLowerCase()}/dashboard`}
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>

            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Shared */}
            <Route path="/map" element={<MapPage />} />
            <Route path="/impact" element={<Impact />} />

            {/* Donor */}
            <Route
              path="/donor/dashboard"
              element={
                <Guard role="DONOR">
                  <DonorDashboard />
                </Guard>
              }
            />

            <Route
              path="/donor/donate"
              element={
                <Guard role="DONOR">
                  <CreateDonation />
                </Guard>
              }
            />

            {/* Matching */}
            <Route
              path="/matching"
              element={
                <Guard>
                  <Matching />
                </Guard>
              }
            />

            {/* Shelter */}
            <Route
              path="/shelter/dashboard"
              element={
                <Guard role="SHELTER">
                  <ShelterDashboard />
                </Guard>
              }
            />

            {/* Driver */}
            <Route
              path="/driver/dashboard"
              element={
                <Guard role="DRIVER">
                  <DriverDashboard />
                </Guard>
              }
            />

            {/* Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <Guard role="ADMIN">
                  <AdminDashboard />
                </Guard>
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
