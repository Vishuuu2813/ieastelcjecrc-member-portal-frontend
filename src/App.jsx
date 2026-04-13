import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MemberDashboard from './pages/MemberDashboard';
import ScrollToTop from './components/ScrollToTop';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardHome from './pages/admin/AdminDashboardHome';
import ManageOffers from './pages/admin/ManageOffers';
import ApproveMembers from './pages/admin/ApproveMembers';
import Applications from './pages/admin/Applications';
import Members from './pages/admin/Members';
import Notifications from './pages/admin/Notifications';
import Settings from './pages/admin/Settings';

// Improved ProtectedRoute
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

const App = () => {
    return (
        <Router>
            <ScrollToTop />
            <Suspense fallback={<div className="flex h-screen items-center justify-center font-bold text-[#0B3D59]">Loading...</div>}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/membership" element={<Register />} />

                    {/* Member dashboard - Wrapped in ProtectedRoute */}
                    <Route path="/dashboard" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
                    <Route path="/dashboard/:tab" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />

                    {/* Admin dashboard - Wrapped in ProtectedRoute */}
                    <Route path="/admin-dashboard" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                        <Route index element={<AdminDashboardHome />} />
                        <Route path="offers" element={<ManageOffers />} />
                        <Route path="approve-members" element={<ApproveMembers />} />
                        <Route path="applications" element={<Applications />} />
                        <Route path="members" element={<Members />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
};

export default App;