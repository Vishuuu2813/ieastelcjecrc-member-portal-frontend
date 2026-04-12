import React, { useState, useEffect } from 'react';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import logo from '../assets/Iaeste Logo Standard 2.png';
import verticalLogo from '../assets/logo-removebg-preview 1.png';
import { apiFetch, setAuthSession } from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Login | IAESTE LC JECRC";
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                auth: false,
                body: { email, password }
            });
            setAuthSession({ token: data.token, user: data.user });
            if (data?.user?.role === 'admin') navigate('/admin-dashboard');
            else navigate('/dashboard');
        } catch (err) {
            setError(err?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const fillCredentials = (type) => {
        if (type === 'admin') {
            setEmail('admin@iaeste.in');
            setPassword('admin123');
        } else {
            setEmail('member@iaeste.in');
            setPassword('member123');
        }
    };

    return (
        <div className="flex flex-col min-h-screen font-outfit bg-gradient-to-br from-[#0B3D59] via-[#002b4d] to-[#001529]">
            {/* Top Left Logo */}
            <div className="absolute top-6 left-6 z-50">
                <div className="cursor-default">
                    <img
                        src={logo}
                        alt="IAESTE Logo"
                        className="h-16 w-auto brightness-0 invert opacity-90 transition-opacity duration-300"
                    />
                </div>
            </div>

            <main className="flex-grow flex items-center justify-center px-4 py-20 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#0B3D59] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-[#002b4d] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

                <div className="relative w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform transition-all duration-300 hover:shadow-[#0B3D59]/20">

                    {/* Left Side - Visual/Brand */}
                    <div className="md:w-1/2 bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(#0B3D59_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>

                        {/* Floating Logo Effect */}
                        <div className="relative z-10 mb-8 transform transition-transform duration-700 hover:scale-110 hover:rotate-3">
                            <img
                                src={verticalLogo}
                                alt="IAESTE Logo"
                                className="w-40 md:w-48 object-contain drop-shadow-2xl filter"
                            />
                        </div>

                        <div className="text-center z-10">
                            <p className="text-[#0B3D59] italic font-medium">"Work. Experience. Discover."</p>
                        </div>

                        {/* Decorative circles */}
                        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#0B3D59]/10 rounded-full blur-xl"></div>
                        <div className="absolute top-12 right-12 w-20 h-20 bg-cyan-400/10 rounded-full blur-xl"></div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                        <div className="md:w-3/4 mx-auto">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold text-[#0B3D59] mb-2 flex items-center gap-3">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                                    </svg>
                                    Portal Login
                                </h3>
                                <p className="text-gray-500 text-sm">Access your IAESTE dashboard</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleLogin}>
                                <div className="group">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-[#0B3D59] transition-colors">
                                        Your Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59] transition-all shadow-sm group-hover:border-blue-300"
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-[#0B3D59] transition-colors">
                                        Your Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59] transition-all shadow-sm group-hover:border-blue-300"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowPassword((s) => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        >
                                            <AnimatePresence mode="wait">
                                                {showPassword ? (
                                                    <motion.span
                                                        key="open-eye"
                                                        initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
                                                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                                        exit={{ opacity: 0, rotate: 20, scale: 0.8 }}
                                                        transition={{ duration: 0.18 }}
                                                        className="flex items-center"
                                                    >
                                                        <VisibilityIcon />
                                                    </motion.span>
                                                ) : (
                                                    <motion.span
                                                        key="closed-eye"
                                                        initial={{ opacity: 0, rotate: 20, scale: 0.8 }}
                                                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                                        exit={{ opacity: 0, rotate: -20, scale: 0.8 }}
                                                        transition={{ duration: 0.18 }}
                                                        className="flex items-center"
                                                    >
                                                        <VisibilityOffIcon />
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#0B3D59] hover:bg-[#072a3f] text-white font-semibold py-3.5 rounded-lg shadow-lg shadow-[#0B3D59]/20 hover:shadow-[#0B3D59]/40 transform transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-sm tracking-wide"
                                >
                                    {loading ? 'LOGGING IN...' : 'LOGIN ACCOUNT'}
                                </button>

                                {error && (
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-700">
                                        {error}
                                    </div>
                                )}

                                {/* Demo Credentials Helper (Temporary)
                                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-gray-600">
                                    <p className="font-semibold mb-2 text-[#0B3D59]">Demo Credentials (Click to fill):</p>
                                    <div className="flex space-x-2">
                                        <button type="button" onClick={() => fillCredentials('member')} className="px-3 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors">Member</button>
                                        <button type="button" onClick={() => fillCredentials('admin')} className="px-3 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors">Admin</button>
                                    </div>
                                </div> */}

                                <div className="flex items-center justify-between text-sm mt-6">
                                    <a href="#" className="text-gray-500 hover:text-[#0B3D59] transition-colors font-medium">Forgot Password?</a>
                                    <Link to="/register" className="text-[#0B3D59] hover:text-[#072a3f] font-semibold transition-colors">Register Now!</Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Login;
