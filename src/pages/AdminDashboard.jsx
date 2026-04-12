import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dashboard as DashboardIcon,
    WorkOutline as OffersIcon,
    Assignment as ApplicationsIcon,
    People as MembersIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    MoreVert as MoreVertIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Menu as MenuIcon,
    CloudUpload as UploadIcon,
    Visibility as VisibilityIcon,
    Campaign as CampaignIcon
} from '@mui/icons-material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import logo from '../assets/Iaeste Logo Standard 2.png';
import { apiFetch, clearAuthSession, getAuthToken } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const ADMIN_TABS = ['dashboard', 'offers', 'approve-members', 'applications', 'members', 'notifications', 'settings'];

// Mock Data
const INITIAL_OFFERS = [
    { id: 1, country: 'Germany', company: 'BMW Group', position: 'Software Engineering Intern', duration: '6 Months', stipend: '€1200/mo', field: 'Computer Science', deadline: '2026-03-01', urgent: true, status: 'Active', applicants: 12 },
    { id: 2, country: 'Switzerland', company: 'CERN', position: 'Research Assistant', duration: '12 Months', stipend: 'CHF 3500/mo', field: 'Physics / IT', deadline: '2026-03-15', urgent: false, status: 'Active', applicants: 8 },
    { id: 3, country: 'Japan', company: 'Toyota', position: 'R&D Intern', duration: '3 Months', stipend: '¥150,000/mo', field: 'Mechanical Eng.', deadline: '2026-02-28', urgent: true, status: 'Closed', applicants: 24 },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [offers, setOffers] = useState(INITIAL_OFFERS);
    const [showAddOfferModal, setShowAddOfferModal] = useState(false);
    const [editingOfferId, setEditingOfferId] = useState(null);

    const [offerSearch, setOfferSearch] = useState('');
    const [offerFromDate, setOfferFromDate] = useState('');
    const [offerToDate, setOfferToDate] = useState('');

    const [members, setMembers] = useState([]); // membership applications from DB
    const [summary, setSummary] = useState({
        totalOffers: 0,
        totalApplicants: 0,
        pendingReview: 0,
        approved: 0,
        rejected: 0
    });
    const [applicationsFilters, setApplicationsFilters] = useState({
        search: '',
        status: 'all',
        fromDate: '',
        toDate: ''
    });
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [membersFilters, setMembersFilters] = useState({
        search: '',
        status: 'all',
        type: 'all',
        passport: 'all'
    });
    const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);
    const [memberDetailLoading, setMemberDetailLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const { tab: urlTab } = useParams();

    // New Offer Form State
    const [newOffer, setNewOffer] = useState({
        offerNumber: '',
        company: '',
        position: '',
        country: '',
        duration: '',
        stipend: '',
        field: '',
        deadline: '',
        urgent: false,
        description: '',
        requirements: ''
    });

    // SEO & Responsive Init
    useEffect(() => {
        document.title = "Admin Dashboard | IAESTE LC JECRC";
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }

        const load = async () => {
            try {
                const me = await apiFetch('/api/me');
                if (me?.user?.role !== 'admin') {
                    clearAuthSession();
                    navigate('/login');
                    return;
                }

                const [sum, offersRes, membershipsRes] = await Promise.all([
                    apiFetch('/api/admin/summary'),
                    apiFetch('/api/admin/offers'),
                    apiFetch('/api/admin/memberships')
                ]);

                setSummary(sum || {});
                setOffers(offersRes.offers || []);
                setMembers(membershipsRes.memberships || []);
            } catch (error) {
                console.error('Failed to load admin dashboard', error);
                clearAuthSession();
                navigate('/login');
            }
        };

        load();

        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [navigate]);

    // Sync URL tab with activeTab so sidebar and URL stay in sync
    useEffect(() => {
        const t = (urlTab || 'dashboard').toLowerCase();
        if (ADMIN_TABS.includes(t)) setActiveTab(t);
        else if (urlTab) navigate('/admin-dashboard', { replace: true });
    }, [urlTab, navigate]);

    useEffect(() => {
        const run = async () => {
            if (activeTab !== 'applications' && activeTab !== 'members' && activeTab !== 'approve-members' && activeTab !== 'notifications') return;
            try {
                const params = new URLSearchParams();
                if (activeTab === 'applications') {
                    if (applicationsFilters.search) params.set('search', applicationsFilters.search);
                    if (applicationsFilters.status) params.set('status', applicationsFilters.status);
                    if (applicationsFilters.fromDate) params.set('fromDate', applicationsFilters.fromDate);
                    if (applicationsFilters.toDate) params.set('toDate', applicationsFilters.toDate);
                }
                const q = params.toString() ? `?${params.toString()}` : '';
                if (activeTab === 'notifications') {
                    const [notifRes, membershipsRes] = await Promise.all([
                        apiFetch('/api/admin/notifications'),
                        apiFetch('/api/admin/memberships')
                    ]);
                    setNotifications(notifRes.notifications || []);
                    setMembers(membershipsRes.memberships || []);
                } else {
                    const membershipsRes = await apiFetch(`/api/admin/memberships${q}`);
                    setMembers(membershipsRes.memberships || []);
                }
            } catch (error) {
                console.error('Failed to load memberships', error);
            }
        };
        run();
    }, [activeTab, applicationsFilters]);

    const handleLogout = () => {
        clearAuthSession();
        navigate('/');
    };

    const handleAddOffer = (e) => {
        e.preventDefault();
        const run = async () => {
            if (editingOfferId) {
                await apiFetch(`/api/admin/offers/${editingOfferId}`, { method: 'PATCH', body: newOffer });
                alert("Offer Updated Successfully!");
            } else {
                await apiFetch('/api/admin/offers', { method: 'POST', body: newOffer });
                alert("Offer Created Successfully!");
            }

            const offersRes = await apiFetch('/api/admin/offers');
            setOffers(offersRes.offers || []);
            const sum = await apiFetch('/api/admin/summary');
            setSummary(sum || {});

            setShowAddOfferModal(false);
            setEditingOfferId(null);
            setNewOffer({
                offerNumber: '',
                company: '',
                position: '',
                country: '',
                duration: '',
                stipend: '',
                field: '',
                deadline: '',
                urgent: false,
                description: '',
                requirements: ''
            });
        };

        run().catch((error) => alert(error?.message || 'Failed to save offer'));
    };

    const updateMemberStatus = (memberId, status) => {
        const run = async () => {
            await apiFetch(`/api/admin/memberships/${memberId}/status`, { method: 'PATCH', body: { status } });
            const membershipsRes = await apiFetch('/api/admin/memberships', {
                auth: true
            });
            setMembers(membershipsRes.memberships || []);
            const sum = await apiFetch('/api/admin/summary');
            setSummary(sum || {});
        };
        run().catch((error) => alert(error?.message || 'Failed to update status'));
    };

    // --- Components ---

    const Sidebar = () => (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{
                    width: isMobile ? 280 : (sidebarOpen ? 280 : 88),
                    x: isMobile && !sidebarOpen ? -280 : 0
                }}
                className={`fixed left-0 top-0 h-full bg-white text-gray-400 ${isMobile ? 'z-[70]' : 'z-40'} flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] pt-20 transition-all duration-300 border-r border-gray-100 overflow-hidden`}
            >
                <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
                    <p className={`px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 transition-opacity duration-200 ${!isMobile && !sidebarOpen ? 'opacity-0 hidden' : 'opacity-100'}`}>Admin Menu</p>
                    <NavButton id="dashboard" icon={<DashboardIcon />} label="Dashboard" />
                    <NavButton id="offers" icon={<OffersIcon />} label="Manage Offers" />
                    <NavButton id="approve-members" icon={<CheckCircleIcon />} label="Approve Members" />
                    <NavButton id="applications" icon={<ApplicationsIcon />} label="Applications" />
                    <NavButton id="members" icon={<MembersIcon />} label="Members" />
                    <NavButton id="notifications" icon={<CampaignIcon />} label="Notifications" />

                    <div className={`my-4 border-t border-gray-100 mx-2 transition-opacity ${!isMobile && !sidebarOpen ? 'opacity-0' : 'opacity-100'}`}></div>

                    <NavButton id="settings" icon={<SettingsIcon />} label="Settings" />
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button onClick={handleLogout} className="flex items-center text-red-400 hover:text-red-300 transition-colors w-full p-2 rounded-lg hover:bg-white/5">
                        <LogoutIcon className="mr-3" />
                        {(sidebarOpen || isMobile) && <span className="font-semibold text-gray-500 hover:text-red-400">Logout</span>}
                    </button>
                </div>

                {/* Desktop Toggle Button */}
                {!isMobile && (
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="absolute -right-3 top-24 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md text-[#003366] hover:bg-[#003366] hover:text-white transition-all duration-200 z-50 transform hover:scale-110"
                    >
                        {sidebarOpen ? <ChevronLeftIcon style={{ fontSize: 16 }} /> : <ChevronRightIcon style={{ fontSize: 16 }} />}
                    </button>
                )}
            </motion.aside>
        </>
    );

    const NavButton = ({ id, icon, label }) => {
        const isActive = activeTab === id;
        const showLabel = isMobile || sidebarOpen;

        return (
            <button
                onClick={() => {
                    setActiveTab(id);
                    navigate(`/admin-dashboard${id === 'dashboard' ? '' : `/${id}`}`);
                    if (isMobile) setSidebarOpen(false);
                }}
                className={`
                    relative w-full flex items-center py-3 px-3.5 rounded-xl transition-all duration-300 group overflow-hidden
                    ${isActive
                        ? 'bg-gradient-to-r from-[#003366] to-[#004080] text-white shadow-md shadow-blue-900/20'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-[#003366]'
                    }
                `}
                title={!showLabel ? label : ''}
            >
                <span className={`flex items-center justify-center transition-all duration-300 z-10 w-6 h-6 ${isActive ? 'text-white' : 'text-gray-600 group-hover:scale-110'}`}>
                    {React.cloneElement(icon, { fontSize: "medium" })}
                </span>
                {showLabel && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="ml-4 font-medium truncate z-10 text-sm"
                    >
                        {label}
                    </motion.span>
                )}
                {!isMobile && !sidebarOpen && isActive && (
                    <motion.div
                        layoutId="activePip"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#D62828] rounded-r-full"
                    />
                )}
            </button>
        );
    };

    const TopNavbar = () => (
        <div className="h-20 bg-white sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between shadow-sm border-b border-gray-200">
            <div className="flex items-center">
                {/* Mobile Menu Button */}
                {isMobile && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <MenuIcon />
                    </button>
                )}
                {/* Logo added to Navbar */}
                <img
                    src={logo}
                    alt="IAESTE"
                    className="h-8 md:h-12 w-auto object-contain mr-4 md:mr-6"
                />
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 capitalize border-l border-gray-200 pl-4 md:pl-6 truncate max-w-[150px] md:max-w-none">
                    {activeTab === 'dashboard' ? 'Admin Overview' : activeTab.replace('-', ' ')}
                </h2>
            </div>

            <div className="flex items-center space-x-2 md:space-x-6">
                <div className="relative hidden md:block">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium" />
                    <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-[#0B3D59]/20 transition-all w-48 lg:w-64" />
                </div>
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B3D59] text-white flex items-center justify-center font-bold shadow-md text-sm md:text-base">
                        A
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Views ---

    const DashboardView = () => {
        const totalMembers = summary.totalApplicants || members.length;
        const totalApplicants = summary.totalApplicants || members.length;
        const pendingReviewCount = summary.pendingReview ?? members.filter(m =>
            (m.status || '').toLowerCase().includes('pending')
        ).length;

        const inStationCount = members.filter(m => m.memberType === 'in-station').length;
        const outStationCount = members.filter(m => m.memberType === 'out-station').length;
        const passportYesCount = members.filter(m => m.hasPassport === 'yes').length;

        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard title="Total Offers" value={offers.length} icon={<OffersIcon />} color="#003366" change="+2 this week" />
                    <StatCard title="Total Applicants" value={totalApplicants} icon={<ApplicationsIcon />} color="#D62828" change="+15% vs last month" />
                    <StatCard title="Total Members" value={totalMembers} icon={<MembersIcon />} color="#10B981" change="+5 new today" />
                    <StatCard title="Pending Review" value={pendingReviewCount} icon={<NotificationsIcon />} color="#F59E0B" change="Action needed" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Application Trends</h3>
                            <select className="text-sm border-gray-200 rounded-lg text-gray-500 bg-gray-50">
                                <option>Last 6 Months</option>
                            </select>
                        </div>
                        <div className="h-64 md:h-72 w-full">
                            <Line
                                data={{
                                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                                    datasets: [{
                                        label: 'Applications',
                                        data: [12, 19, 3, 5, 2, 3],
                                        borderColor: '#0B3D59',
                                        tension: 0.4,
                                        fill: true,
                                        backgroundColor: 'rgba(11, 61, 89, 0.1)'
                                    }]
                                }}
                                options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } } }}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activities</h3>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-start p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#0B3D59] font-bold mr-3 text-xs">
                                        {i % 2 === 0 ? 'APP' : 'USR'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{i % 2 === 0 ? 'New Application Received' : 'New Member Registered'}</p>
                                        <p className="text-xs text-gray-500">2 hours ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">In-Station Members</p>
                        <p className="text-2xl font-bold text-gray-800">{inStationCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Out-Station Members</p>
                        <p className="text-2xl font-bold text-gray-800">{outStationCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Members with Passport</p>
                        <p className="text-2xl font-bold text-gray-800">{passportYesCount}</p>
                    </div>
                </div>
            </div>
        );
    };

    const OffersView = () => {
        const normalizedSearch = offerSearch.trim().toLowerCase();

        const filteredOffers = offers.filter((offer) => {
            const deadline = offer.deadline || '';
            const matchesSearch =
                !normalizedSearch ||
                [offer.offerNumber, offer.company, offer.position, offer.country, offer.field]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(normalizedSearch));

            if (!matchesSearch) return false;

            if (offerFromDate && deadline < offerFromDate) return false;
            if (offerToDate && deadline > offerToDate) return false;

            return true;
        });

        const handleOpenCreate = () => {
            setEditingOfferId(null);
            setNewOffer({
                company: '',
                position: '',
                country: '',
                duration: '',
                stipend: '',
                field: '',
                deadline: '',
                urgent: false,
                description: '',
                requirements: ''
            });
            setShowAddOfferModal(true);
        };

        const handleEditOfferClick = (offer) => {
            setEditingOfferId(offer._id || offer.id);
            setNewOffer({
                company: offer.company || '',
                position: offer.position || '',
                country: offer.country || '',
                duration: offer.duration || '',
                stipend: offer.stipend || '',
                field: offer.field || '',
                deadline: offer.deadline || '',
                urgent: !!offer.urgent,
                description: offer.description || '',
                requirements: offer.requirements || ''
            });
            setShowAddOfferModal(true);
        };

        const handleDeleteOffer = (offerId) => {
            if (!window.confirm('Are you sure you want to delete this offer?')) return;
            const run = async () => {
                await apiFetch(`/api/admin/offers/${offerId}`, { method: 'DELETE' });
                const offersRes = await apiFetch('/api/admin/offers');
                setOffers(offersRes.offers || []);
                const sum = await apiFetch('/api/admin/summary');
                setSummary(sum || {});
            };
            run().catch((error) => alert(error?.message || 'Failed to delete offer'));
        };

        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <h3 className="text-xl font-bold text-gray-800">All Offers</h3>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center px-4 py-2 bg-[#0B3D59] text-white rounded-lg hover:bg-[#09314a] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 w-full sm:w-auto justify-center"
                    >
                        <AddIcon className="mr-2" />
                        Add New Offer
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search</label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={offerSearch}
                                    onChange={(e) => setOfferSearch(e.target.value)}
                                    placeholder="Search by employer, role, country..."
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 w-full md:w-auto">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={offerFromDate}
                                    onChange={(e) => setOfferFromDate(e.target.value)}
                                    className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={offerToDate}
                                    onChange={(e) => setOfferToDate(e.target.value)}
                                    className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Employer/Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Location</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Applicants</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOffers.map(offer => (
                                    <tr key={offer._id || offer.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl mr-3 shadow-sm border border-blue-100 text-[#003366]">
                                                    <OffersIcon fontSize="inherit" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{offer.offerNumber || offer.company}</p>
                                                    <p className="text-sm text-gray-500">{offer.offerNumber ? offer.company : offer.position}</p>
                                                    <p className="text-xs text-gray-400">{offer.offerNumber ? offer.position : ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-700">{offer.country}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200"></div>
                                                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-300"></div>
                                                <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">+{offer.applicants}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${offer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {offer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="text-gray-400 hover:text-[#0B3D59] mx-1"
                                                onClick={() => handleEditOfferClick(offer)}
                                            >
                                                <EditIcon fontSize="small" />
                                            </button>
                                            <button
                                                className="text-gray-400 hover:text-red-500 mx-1"
                                                onClick={() => handleDeleteOffer(offer._id || offer.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredOffers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                                            No offers found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const ApproveMembersView = () => {
        const normalizedSearch = applicationsFilters.search.trim().toLowerCase();

        const filteredApplications = members.filter((member) => {
            const createdDate = (member.createdAt || '').slice(0, 10);

            const matchesSearch =
                !normalizedSearch ||
                [member.fullName, member.registrationNumber, member.email, member.whatsappNumber]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(normalizedSearch));

            if (!matchesSearch) return false;

            if (applicationsFilters.status !== 'all') {
                if ((member.status || '').toLowerCase() !== applicationsFilters.status.toLowerCase()) {
                    return false;
                }
            }

            if (applicationsFilters.fromDate && createdDate && createdDate < applicationsFilters.fromDate) {
                return false;
            }
            if (applicationsFilters.toDate && createdDate && createdDate > applicationsFilters.toDate) {
                return false;
            }

            return true;
        });

        const handleFilterChange = (field, value) => {
            setApplicationsFilters(prev => ({ ...prev, [field]: value }));
        };

        return (
            <div className="space-y-6 animate-fade-in-up">
                <h3 className="text-xl font-bold text-gray-800">Approve Members</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Applicant</label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={applicationsFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search by name, roll no, email..."
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 w-full md:w-auto">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={applicationsFilters.fromDate}
                                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                    className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={applicationsFilters.toDate}
                                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                    className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                />
                            </div>
                            {/* Status filter not needed here; this view only shows pending requests */}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Full Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Registration/Roll No.</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Membership Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Created On</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredApplications
                                    .filter((member) => (member.status || 'Pending Review') === 'Pending Review')
                                    .map((member) => {
                                    const createdDate = (member.createdAt || '').slice(0, 10);
                                    const status = member.status || 'Pending Review';

                                    return (
                                        <tr key={member._id || member.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-800">{member.fullName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{member.registrationNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                                                {member.memberType ? member.memberType.replace('-', ' ') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {createdDate || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold 
                                                    ${status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    className="text-[#0B3D59] hover:underline text-sm font-semibold"
                                                    onClick={() => setSelectedApplication(member)}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                                                    title="Approve"
                                                    onClick={() => setSelectedApplication(member)}
                                                >
                                                    <CheckCircleIcon fontSize="small" />
                                                </button>
                                                <button
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                                                    title="Reject"
                                                    onClick={() => updateMemberStatus(member._id || member.id, 'Rejected')}
                                                >
                                                    <CancelIcon fontSize="small" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredApplications.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                                            No applications found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const ApplicationsView = () => (
        <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
                <ApplicationsIcon style={{ fontSize: 64, opacity: 0.5 }} />
                <p className="mt-4 text-lg">Offer applications section under development</p>
                <p className="text-sm">Membership approvals are available under "Approve Members".</p>
            </div>
        </div>
    );

    const MembersView = () => {
        const normalizedSearch = membersFilters.search.trim().toLowerCase();

        const filteredMembers = members
            .filter((member) => (member.status || '') === 'Approved')
            .filter((member) => {
                const matchesSearch =
                    !normalizedSearch ||
                    [member.fullName, member.registrationNumber, member.email, member.whatsappNumber]
                        .filter(Boolean)
                        .some((value) => value.toLowerCase().includes(normalizedSearch));

                if (!matchesSearch) return false;

                if (membersFilters.type !== 'all') {
                    if ((member.memberType || '') !== membersFilters.type) {
                        return false;
                    }
                }

                if (membersFilters.passport === 'yes' && member.hasPassport !== 'yes') return false;
                if (membersFilters.passport === 'no' && member.hasPassport !== 'no') return false;

                return true;
            });

        const handleFilterChange = (field, value) => {
            setMembersFilters(prev => ({ ...prev, [field]: value }));
        };

        return (
            <div className="space-y-6 animate-fade-in-up">
                <h3 className="text-xl font-bold text-gray-800">Members Directory</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Member</label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={membersFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search by name, roll no, email..."
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 w-full md:w-auto">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Membership Type</label>
                                <select
                                    value={membersFilters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                >
                                    <option value="all">All</option>
                                    <option value="in-station">In-Station</option>
                                    <option value="out-station">Out-Station</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Passport</label>
                                <select
                                    value={membersFilters.passport}
                                    onChange={(e) => handleFilterChange('passport', e.target.value)}
                                    className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                >
                                    <option value="all">All</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Full Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Registration/Roll No.</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Membership Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Passport</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredMembers.map((member) => {
                                    const createdAt = member.createdAt ? new Date(member.createdAt) : null;
                                    const dateStr = createdAt ? createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                                    const timeStr = createdAt ? createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                                    return (
                                        <tr key={member._id || member.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-800">{member.fullName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{member.registrationNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{member.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                                                {member.memberType ? member.memberType.replace('-', ' ') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {member.hasPassport
                                                    ? member.hasPassport === 'yes'
                                                        ? 'Yes'
                                                        : 'No'
                                                    : 'Not specified'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {dateStr}{timeStr ? ` • ${timeStr}` : ''}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setMemberDetailLoading(true);
                                                        setSelectedMemberDetail(null);
                                                        apiFetch(`/api/admin/members/${member._id}/detail`)
                                                            .then((data) => {
                                                                setSelectedMemberDetail(data);
                                                            })
                                                            .catch((e) => alert(e?.message || 'Failed to load member'))
                                                            .finally(() => setMemberDetailLoading(false));
                                                    }}
                                                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#0B3D59] text-white text-xs font-semibold hover:bg-[#09314a] transition-colors"
                                                >
                                                    <VisibilityIcon style={{ fontSize: 14 }} className="mr-1" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredMembers.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                                            No approved members found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const SettingsView = () => {
        const [currentPassword, setCurrentPassword] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [pwMessage, setPwMessage] = useState('');
        const [pwError, setPwError] = useState('');
        const [pwLoading, setPwLoading] = useState(false);

        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Settings</h3>
                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Change Password</h4>
                        <p className="text-sm text-gray-500 mb-4">Enter your current password to set a new one.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                    placeholder="Enter your current password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                    placeholder="At least 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                    placeholder="Repeat new password"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                            <p className="text-[11px] text-gray-500">
                                You must enter your current password to change it.
                            </p>
                            <button
                                type="button"
                                disabled={pwLoading}
                                onClick={async () => {
                                    setPwError('');
                                    setPwMessage('');
                                    if (!currentPassword) {
                                        setPwError('Please enter your current password.');
                                        return;
                                    }
                                    if (!newPassword || newPassword.length < 6) {
                                        setPwError('New password must be at least 6 characters.');
                                        return;
                                    }
                                    if (newPassword !== confirmPassword) {
                                        setPwError('New password and confirmation do not match.');
                                        return;
                                    }
                                    try {
                                        setPwLoading(true);
                                        await apiFetch('/api/me/password', {
                                            method: 'PATCH',
                                            body: { currentPassword, newPassword }
                                        });
                                        setPwMessage('Password updated successfully.');
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    } catch (error) {
                                        setPwError(error?.message || 'Failed to update password');
                                    } finally {
                                        setPwLoading(false);
                                    }
                                }}
                                className="px-5 py-2 rounded-lg bg-[#0B3D59] text-white text-xs font-semibold hover:bg-[#09314a] disabled:opacity-60"
                            >
                                {pwLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                        {pwError && <p className="mt-2 text-xs text-red-600">{pwError}</p>}
                        {pwMessage && <p className="mt-2 text-xs text-green-600">{pwMessage}</p>}
                    </div>
                </div>
            </div>
        );
    };

    const NotificationsView = () => {
        const [title, setTitle] = useState('');
        const [body, setBody] = useState('');
        const [recipientType, setRecipientType] = useState('broadcast'); // 'broadcast' | 'individual'
        const [selectedMemberIds, setSelectedMemberIds] = useState([]);
        const [sending, setSending] = useState(false);
        const [msg, setMsg] = useState('');
        const [err, setErr] = useState('');
        const approvedMembers = members.filter((m) => (m.status || '') === 'Approved');

        const toggleMember = (membershipId) => {
            const membership = approvedMembers.find((m) => (m._id || m.id) === membershipId);
            if (!membership) return;
            const user = membership._id;
            setSelectedMemberIds((prev) => (prev.includes(user) ? prev.filter((x) => x !== user) : [...prev, user]));
        };

        const handleSend = async () => {
            setErr('');
            setMsg('');
            if (!title || !title.trim()) {
                setErr('Title is required');
                return;
            }
            try {
                setSending(true);
                let recipientIds = [];
                if (recipientType === 'individual') {
                    if (selectedMemberIds.length === 0) {
                        setErr('Select at least one member');
                        setSending(false);
                        return;
                    }
                    const userIds = await Promise.all(
                        selectedMemberIds.map(async (membershipId) => {
                            const r = await apiFetch(`/api/admin/members/${membershipId}/detail`);
                            return r?.user?.id || null;
                        })
                    );
                    recipientIds = userIds.filter(Boolean);
                    if (recipientIds.length === 0) {
                        setErr('Could not resolve selected members');
                        setSending(false);
                        return;
                    }
                }
                await apiFetch('/api/admin/notifications', {
                    method: 'POST',
                    body: { title: title.trim(), body: body.trim(), recipientIds }
                });
                setMsg('Notification sent successfully!');
                setTitle('');
                setBody('');
                setSelectedMemberIds([]);
                const notifRes = await apiFetch('/api/admin/notifications');
                setNotifications(notifRes.notifications || []);
            } catch (e) {
                setErr(e?.message || 'Failed to send');
            } finally {
                setSending(false);
            }
        };

        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Create Notification</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                placeholder="Notification title"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                placeholder="Notification message (optional)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Send To</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="recipient" checked={recipientType === 'broadcast'} onChange={() => setRecipientType('broadcast')} />
                                    <span>All Members (Broadcast)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="recipient" checked={recipientType === 'individual'} onChange={() => setRecipientType('individual')} />
                                    <span>Selected Members</span>
                                </label>
                            </div>
                        </div>
                        {recipientType === 'individual' && (
                            <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Select Members</p>
                                <div className="space-y-2">
                                    {approvedMembers.map((m) => (
                                        <label key={m._id || m.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedMemberIds.includes(m._id || m.id)}
                                                onChange={() => toggleMember(m._id || m.id)}
                                            />
                                            <span className="text-sm">{m.fullName} ({m.email})</span>
                                        </label>
                                    ))}
                                    {approvedMembers.length === 0 && <p className="text-sm text-gray-500">No approved members</p>}
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            disabled={sending}
                            onClick={handleSend}
                            className="px-5 py-2 rounded-lg bg-[#0B3D59] text-white text-sm font-semibold hover:bg-[#09314a] disabled:opacity-60"
                        >
                            {sending ? 'Sending...' : 'Send Notification'}
                        </button>
                        {msg && <p className="text-sm text-green-600">{msg}</p>}
                        {err && <p className="text-sm text-red-600">{err}</p>}
                    </div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Notifications</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-gray-500">No notifications yet</p>
                        ) : (
                            notifications.map((n) => {
                                const d = n.createdAt ? new Date(n.createdAt) : null;
                                const dateStr = d ? d.toLocaleString('en-IN') : '';
                                const recipients = n.recipientIds?.length ? `${n.recipientIds.length} member(s)` : 'All members';
                                return (
                                    <div key={n._id} className="p-3 border border-gray-100 rounded-lg">
                                        <p className="font-semibold text-gray-800">{n.title}</p>
                                        {n.body && <p className="text-sm text-gray-600 mt-1">{n.body}</p>}
                                        <p className="text-xs text-gray-500 mt-2">To: {recipients} • {dateStr}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const MemberDetailModal = ({ data, onClose, onApplicationUpdated }) => {
        const [updatingId, setUpdatingId] = useState(null);
        const [editStatus, setEditStatus] = useState({});
        const [editReason, setEditReason] = useState({});
        if (!data) return null;
        const { membership, user, applications, stats } = data;

        const handleUpdateApplication = async (appId) => {
            const status = editStatus[appId];
            const reason = editReason[appId] || '';
            if (!status) return;
            try {
                setUpdatingId(appId);
                await apiFetch(`/api/admin/applications/${appId}`, {
                    method: 'PATCH',
                    body: { status, rejectionReason: status === 'Rejected' ? reason : '' }
                });
                setEditStatus((p) => ({ ...p, [appId]: undefined }));
                setEditReason((p) => ({ ...p, [appId]: '' }));
                if (onApplicationUpdated) {
                    const updated = await apiFetch(`/api/admin/members/${membership._id}/detail`);
                    onApplicationUpdated(updated);
                }
            } catch (e) {
                alert(e?.message || 'Failed to update');
            } finally {
                setUpdatingId(null);
            }
        };

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="text-xl font-bold text-[#0B3D59]">Member Details</h3>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                            <CancelIcon />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 rounded-xl">
                                <p className="text-xs text-gray-500 font-semibold uppercase">Total Applied</p>
                                <p className="text-2xl font-bold text-[#0B3D59]">{stats?.totalApplied ?? 0}</p>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-xl">
                                <p className="text-xs text-gray-500 font-semibold uppercase">Submitted</p>
                                <p className="text-2xl font-bold text-amber-700">{stats?.submitted ?? 0}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl">
                                <p className="text-xs text-gray-500 font-semibold uppercase">Selected</p>
                                <p className="text-2xl font-bold text-green-700">{stats?.selected ?? 0}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl">
                                <p className="text-xs text-gray-500 font-semibold uppercase">Rejected</p>
                                <p className="text-2xl font-bold text-red-700">{stats?.rejected ?? 0}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-4">Profile</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailRow label="Full Name" value={membership?.fullName} />
                                <DetailRow label="Registration/Roll No." value={membership?.registrationNumber} />
                                <DetailRow label="Email" value={membership?.email || user?.email} />
                                <DetailRow label="WhatsApp" value={membership?.whatsappNumber} />
                                <DetailRow label="Course" value={membership?.course} />
                                <DetailRow label="Branch & Section" value={membership?.branchSection} />
                                <DetailRow label="Semester" value={membership?.semester} />
                                <DetailRow label="Member Type" value={membership?.memberType?.replace('-', ' ')} />
                                <DetailRow label="Passport" value={membership?.hasPassport === 'yes' ? 'Yes' : membership?.hasPassport === 'no' ? 'No' : '-'} />
                                {membership?.createdAt && (
                                    <DetailRow label="Joined" value={new Date(membership.createdAt).toLocaleString('en-IN')} />
                                )}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-4">Offer Applications</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="py-2 text-xs font-bold text-gray-500 uppercase">Offer</th>
                                            <th className="py-2 text-xs font-bold text-gray-500 uppercase">Employer</th>
                                            <th className="py-2 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="py-2 text-xs font-bold text-gray-500 uppercase">Rejection Reason</th>
                                            <th className="py-2 text-xs font-bold text-gray-500 uppercase">Update</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(applications || []).map((app) => (
                                            <tr key={app._id} className="hover:bg-gray-50">
                                                <td className="py-3 text-sm font-medium">{app.offer?.position || '-'}</td>
                                                <td className="py-3 text-sm">{app.offer?.company || '-'}</td>
                                                <td className="py-3">
                                                    {updatingId === app._id ? (
                                                        <span className="text-xs text-gray-500">Updating...</span>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                            app.status === 'Selected' ? 'bg-green-100 text-green-700' :
                                                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            app.status === 'Shortlisted' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-50 text-blue-700'
                                                        }`}>{app.status || 'Submitted'}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-sm text-gray-600">
                                                    {app.status === 'Rejected' && app.rejectionReason ? app.rejectionReason : '-'}
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <select
                                                            value={editStatus[app._id] ?? app.status}
                                                            onChange={(e) => setEditStatus((p) => ({ ...p, [app._id]: e.target.value }))}
                                                            className="text-xs border border-gray-200 rounded px-2 py-1"
                                                        >
                                                            <option value="Submitted">Submitted</option>
                                                            <option value="Shortlisted">Shortlisted</option>
                                                            <option value="Selected">Selected</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                        {editStatus[app._id] === 'Rejected' && (
                                                            <input
                                                                type="text"
                                                                placeholder="Rejection reason"
                                                                value={editReason[app._id] ?? app.rejectionReason ?? ''}
                                                                onChange={(e) => setEditReason((p) => ({ ...p, [app._id]: e.target.value }))}
                                                                className="text-xs border border-gray-200 rounded px-2 py-1 w-full"
                                                            />
                                                        )}
                                                        <button
                                                            onClick={() => handleUpdateApplication(app._id)}
                                                            disabled={updatingId === app._id}
                                                            className="text-xs px-2 py-1 rounded bg-[#0B3D59] text-white hover:bg-[#09314a] disabled:opacity-60"
                                                        >
                                                            Update
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!applications || applications.length === 0) && (
                                            <tr>
                                                <td colSpan="5" className="py-6 text-center text-sm text-gray-500">No applications yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    };

    const StatCard = ({ title, value, icon, color, change }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
                    <span className="text-2xl md:text-3xl font-bold text-gray-800">{value}</span>
                </div>
                <div className="p-3 rounded-xl bg-opacity-10" style={{ backgroundColor: `${color}20`, color: color }}>
                    {icon}
                </div>
            </div>
            <p className="text-xs font-medium text-green-600 flex items-center">
                <span className="bg-green-100 px-1.5 py-0.5 rounded mr-2">↑</span>
                {change}
            </p>
        </div>
    );

    const DetailRow = ({ label, value }) => (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-medium text-gray-800 break-words">{value || '-'}</p>
        </div>
    );

    const AddOfferModal = () => (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-2xl font-bold text-[#0B3D59]">
                        {editingOfferId ? 'Edit Offer' : 'Create New Offer'}
                    </h3>
                    <button
                        onClick={() => {
                            setShowAddOfferModal(false);
                            setEditingOfferId(null);
                            setNewOffer({
                                company: '',
                                position: '',
                                country: '',
                                duration: '',
                                stipend: '',
                                field: '',
                                deadline: '',
                                urgent: false,
                                description: '',
                                requirements: ''
                            });
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <CancelIcon />
                    </button>
                </div>

                <form onSubmit={handleAddOffer} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Offer Number</label>
                        <input required type="text" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none"
                            value={newOffer.offerNumber} onChange={e => setNewOffer({ ...newOffer, offerNumber: e.target.value })} placeholder="e.g. DE-2024-1234" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Employer Name</label>
                            <input required type="text" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none"
                                value={newOffer.company} onChange={e => setNewOffer({ ...newOffer, company: e.target.value })} placeholder="e.g. Google" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Position Title</label>
                            <input required type="text" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none"
                                value={newOffer.position} onChange={e => setNewOffer({ ...newOffer, position: e.target.value })} placeholder="e.g. Frontend Intern" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Country</label>
                            <input required type="text" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none"
                                value={newOffer.country} onChange={e => setNewOffer({ ...newOffer, country: e.target.value })} placeholder="e.g. Germany" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Deadline</label>
                            <input required type="date" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none"
                                value={newOffer.deadline} onChange={e => setNewOffer({ ...newOffer, deadline: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Stipend</label>
                            <input required type="text" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none"
                                value={newOffer.stipend} onChange={e => setNewOffer({ ...newOffer, stipend: e.target.value })} placeholder="e.g. €1200/mo" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Period</label>
                            <input required type="text" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none"
                                value={newOffer.duration} onChange={e => setNewOffer({ ...newOffer, duration: e.target.value })} placeholder="e.g. 6 Months" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Fields/Disciplines</label>
                        <input required type="text" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none"
                            value={newOffer.field} onChange={e => setNewOffer({ ...newOffer, field: e.target.value })} placeholder="e.g. Computer Science, Mechanical Engineering" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Full Description</label>
                        <textarea rows="4" className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0B3D59] outline-none resize-none"
                            value={newOffer.description} onChange={e => setNewOffer({ ...newOffer, description: e.target.value })} placeholder="Detailed job description..." />
                    </div>

                    <div className="flex items-center space-x-2 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <input
                            type="checkbox"
                            id="urgent"
                            checked={newOffer.urgent}
                            onChange={e => setNewOffer({ ...newOffer, urgent: e.target.checked })}
                            className="w-5 h-5 text-[#0B3D59] rounded"
                        />
                        <label htmlFor="urgent" className="text-sm font-bold text-gray-700 cursor-pointer">Deadline Approaching</label>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddOfferModal(false);
                                setEditingOfferId(null);
                                setNewOffer({
                                    company: '',
                                    position: '',
                                    country: '',
                                    flag: '',
                                    duration: '',
                                    stipend: '',
                                    field: '',
                                    deadline: '',
                                    urgent: false,
                                    description: '',
                                    requirements: ''
                                });
                            }}
                            className="px-6 py-3 rounded-lg text-gray-500 font-bold hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 rounded-lg bg-[#0B3D59] text-white font-bold hover:bg-[#09314a] shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            {editingOfferId ? 'Save Changes' : 'Publish Offer'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );

    const ApplicationDetailModal = ({ application, onClose, onApprove }) => {
        const [loginEmail, setLoginEmail] = useState(application?.email || '');
        const [loginPassword, setLoginPassword] = useState('');
        const [saving, setSaving] = useState(false);

        if (!application) return null;

        const createdDate = application.createdAt ? application.createdAt.slice(0, 10) : '';

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <div>
                            <h3 className="text-2xl font-bold text-[#0B3D59]">Application Details</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Review complete membership details for this applicant.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <CancelIcon />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white rounded-xl p-4 md:p-6 border border-gray-100">
                            <DetailRow label="Full Name" value={application.fullName} />
                            <DetailRow label="Registration/Roll No." value={application.registrationNumber} />
                            <DetailRow label="Email Address" value={application.email} />
                            <DetailRow label="WhatsApp No." value={application.whatsappNumber} />
                            <DetailRow label="Course" value={application.course} />
                            <DetailRow label="Branch & Section" value={application.branchSection} />
                            <DetailRow label="Current Semester" value={application.semester} />
                            <DetailRow
                                label="Type of Membership"
                                value={application.memberType ? application.memberType.replace('-', ' ') : ''}
                            />
                            <DetailRow
                                label="Do you have a passport?"
                                value={
                                    application.hasPassport
                                        ? application.hasPassport === 'yes'
                                            ? 'Yes'
                                            : 'No'
                                        : 'Not specified'
                                }
                            />
                            <DetailRow label="Created On" value={createdDate} />
                            <DetailRow label="Status" value={application.status || 'Pending Review'} />
                        </div>

                        {application.memberType === 'out-station' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white rounded-xl p-4 md:p-6 border border-gray-100">
                                <DetailRow label="University Name" value={application.universityName} />
                                <DetailRow label="University State" value={application.universityState} />
                                <DetailRow label="University City" value={application.universityCity} />
                                <DetailRow label="University Pincode" value={application.universityPincode} />
                                <DetailRow label="University Address" value={application.universityAddress} />
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-xs text-gray-700">
                            <p className="font-semibold text-yellow-800">Important</p>
                            <p className="mt-1">
                                Fees once paid is not refundable under any circumstances. Please ensure details are correct
                                before confirming the final membership status.
                            </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4">
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Create Login Credentials</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Login Email</label>
                                    <input
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                        placeholder="member@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Temporary Password</label>
                                    <input
                                        type="text"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                        placeholder="At least 6 characters"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Share these credentials with the member after approval. They can change the password later from their dashboard.
                            </p>
                        </div>
                    </div>
                    <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-500 text-sm font-semibold hover:bg-gray-100"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={async () => {
                                if (!onApprove) return;
                                try {
                                    setSaving(true);
                                    await onApprove(application._id || application.id, loginEmail, loginPassword);
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            className="px-6 py-2 rounded-lg bg-[#0B3D59] text-white text-sm font-bold hover:bg-[#09314a] disabled:opacity-70"
                        >
                            {saving ? 'Approving...' : 'Approve & Create Login'}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    };

    // Calculate main margin based on sidebar state
    const mainMargin = isMobile ? 'ml-0' : (sidebarOpen ? 'ml-[280px]' : 'ml-[88px]');

    return (
        <div className="min-h-screen bg-[#F4F6F8] font-sans flex text-[#1F2937] relative">
            {/* Top Navbar - Z-Index Higher than Sidebar */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <TopNavbar />
            </div>

            {/* Sidebar */}
            <Sidebar />

            <div className={`flex-1 transition-all duration-300 ease-in-out pt-20 ${mainMargin}`}>
                <main className="p-4 md:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'dashboard' && <DashboardView />}
                            {activeTab === 'offers' && <OffersView />}
                            {activeTab === 'approve-members' && <ApproveMembersView />}
                            {activeTab === 'applications' && <ApplicationsView />}
                            {activeTab === 'members' && <MembersView />}
                            {activeTab === 'notifications' && <NotificationsView />}
                            {activeTab === 'settings' && <SettingsView />}
                            {!['dashboard', 'offers', 'approve-members', 'applications', 'members', 'notifications', 'settings'].includes(activeTab) && (
                                <div className="flex items-center justify-center h-96 text-gray-400">
                                    <div className="text-center">
                                        <SettingsIcon style={{ fontSize: 64, opacity: 0.5 }} />
                                        <p className="mt-4 text-lg">Section under development</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {showAddOfferModal && <AddOfferModal />}
            {memberDetailLoading && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
                    <div className="text-white font-semibold">Loading member details...</div>
                </div>
            )}
            <AnimatePresence>
                {selectedMemberDetail && (
                    <MemberDetailModal
                        data={selectedMemberDetail}
                        onClose={() => setSelectedMemberDetail(null)}
                        onApplicationUpdated={(updated) => updated && setSelectedMemberDetail(updated)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {selectedApplication && (
                    <ApplicationDetailModal
                        application={selectedApplication}
                        onClose={() => setSelectedApplication(null)}
                        onApprove={async (id, loginEmail, loginPassword) => {
                            try {
                                await apiFetch(`/api/admin/memberships/${id}/status`, {
                                    method: 'PATCH',
                                    body: { status: 'Approved', loginEmail, password: loginPassword }
                                });
                                const [sum, membershipsRes] = await Promise.all([
                                    apiFetch('/api/admin/summary'),
                                    apiFetch('/api/admin/memberships')
                                ]);
                                setSummary(sum || {});
                                setMembers(membershipsRes.memberships || []);
                                setSelectedApplication(null);
                                alert('Member approved and login created.');
                            } catch (error) {
                                alert(error?.message || 'Failed to approve member');
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
