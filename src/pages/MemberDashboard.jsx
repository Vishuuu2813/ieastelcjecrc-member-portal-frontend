import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dashboard as DashboardIcon,
    WorkOutline as OffersIcon,
    Assignment as ApplicationsIcon,
    Description as DocumentsIcon,
    EmojiEvents as NominationIcon,
    // Assessment icon removed (Analytics tab removed)
    Notifications as NotificationsIcon,
    Person as ProfileIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Business as CompanyIcon,
    AttachMoney as StipendIcon,
    School as FieldIcon,
    Download as DownloadIcon,
    BookmarkBorder as BookmarkIcon,
    Send as SendIcon,
    Close as CloseIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Menu as MenuIcon,
    KeyboardArrowDown as ArrowDownIcon,
    PictureAsPdf as PdfIcon,
    Info as InfoIcon,
    Article as ArticleIcon,
    CalendarMonth as CalendarIcon
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
import { Line, Bar } from 'react-chartjs-2';
import logo from '../assets/Iaeste Logo Standard 2.png';
import { apiFetch, clearAuthSession, getAuthToken, API_BASE_URL } from '../utils/api';

// Register ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const MEMBER_TABS = ['dashboard', 'offers', 'applications', 'nomination', 'notifications', 'documents', 'saved', 'profile', 'settings'];

const OFFER_CATEGORIES = ['all', 'CS & IT', 'Mech', 'Civil', 'Elec', 'Electronics', 'Eco', 'Mgmt', 'Bio/Chem', 'Other'];

const mapFieldToCategory = (field) => {
    if (!field) return 'Other';
    const f = field.toLowerCase();
    if (f.includes('computer') || f.includes('software') || f.includes('cs') || f.includes('information technology') || f.includes('it') || f.includes('data science') || f.includes('web') || f.includes('python') || f.includes('java')) return 'CS & IT';
    if (f.includes('mechanical') || f.includes('mechatronics') || f.includes('mech')) return 'Mech';
    if (f.includes('civil') || f.includes('architecture') || f.includes('construction')) return 'Civil';
    if (f.includes('electrical') || f.includes('ee')) return 'Elec';
    if (f.includes('electronics') || f.includes('ece') || f.includes('embedded') || f.includes('telecom')) return 'Electronics';
    if (f.includes('economics') || f.includes('finance') || f.includes('eco')) return 'Eco';
    if (f.includes('management') || f.includes('business') || f.includes('mba') || f.includes('hr')) return 'Mgmt';
    if (f.includes('biology') || f.includes('biotech') || f.includes('chemistry') || f.includes('chemical') || f.includes('pharm') || f.includes('bio')) return 'Bio/Chem';
    return 'Other';
};

// Mock Data
const OFFERS = [
    { id: 1, country: 'Germany', company: 'BMW Group', position: 'Software Engineering Intern', duration: '6 Months', stipend: '€1200/mo', field: 'Computer Science', deadline: '2026-03-01', urgent: true },
    { id: 2, country: 'Switzerland', company: 'CERN', position: 'Research Assistant', duration: '12 Months', stipend: 'CHF 3500/mo', field: 'Physics / IT', deadline: '2026-03-15', urgent: false },
    { id: 3, country: 'Japan', company: 'Toyota', position: 'R&D Intern', duration: '3 Months', stipend: '¥150,000/mo', field: 'Mechanical Eng.', deadline: '2026-02-28', urgent: true },
    { id: 4, country: 'Sweden', company: 'Spotify', position: 'Data Science Intern', duration: '6 Months', stipend: 'SEK 25,000/mo', field: 'Data Science', deadline: '2026-04-10', urgent: false },
];

export default function MemberDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentMember, setCurrentMember] = useState(null); // membership application/profile
    const [offers, setOffers] = useState(OFFERS);
    const [applications, setApplications] = useState([]);
    const [savedOfferIds, setSavedOfferIds] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotificationBanner, setShowNotificationBanner] = useState(true);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [filterField, setFilterField] = useState('all');
    const [offerSearch, setOfferSearch] = useState('');

    const navigate = useNavigate();
    const { tab: urlTab } = useParams();

    // SEO & Responsive Init
    useEffect(() => {
        document.title = "Member Dashboard | IAESTE LC JECRC";
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }

        const load = async () => {
            try {
                const me = await apiFetch('/api/me');

                // Do not auto-redirect admins to admin portal; let them stay on member dashboard if they opened it.
                // Login.jsx already sends admins to /admin-dashboard after sign-in.

                setCurrentUser(me.user);
                setCurrentMember(me.membership);

                if (me?.user?.registrationNumber) {
                    const metaKey = `iaesteMemberMeta_${me.user.registrationNumber}`;
                    try {
                        const storedMeta = JSON.parse(localStorage.getItem(metaKey) || '{}');
                        setSavedOfferIds(storedMeta.savedOfferIds || []);
                    } catch (e) {
                        console.error('Failed to load saved offers meta', e);
                    }
                }

                const offersRes = await apiFetch('/api/offers', { auth: false });
                setOffers(offersRes.offers || []);

                const appsRes = await apiFetch('/api/my/applications');
                setApplications(appsRes.applications || []);

                const notifRes = await apiFetch('/api/me/notifications');
                setNotifications(notifRes.notifications || []);
            } catch (error) {
                console.error('Failed to load member dashboard', error);
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

    // Sync URL tab with activeTab
    useEffect(() => {
        const t = (urlTab || 'dashboard').toLowerCase();
        if (MEMBER_TABS.includes(t)) {
            setActiveTab(t);
        } else if (urlTab) {
            // Unknown tab in URL (e.g. /dashboard/analytics) — reset UI and URL to dashboard
            setActiveTab('dashboard');
            navigate('/dashboard', { replace: true });
        }
    }, [urlTab, navigate]);

    const persistSavedOffers = (nextSavedOfferIds) => {
        setSavedOfferIds(nextSavedOfferIds);
        if (!currentUser?.registrationNumber) return;
        const metaKey = `iaesteMemberMeta_${currentUser.registrationNumber}`;
        try {
            localStorage.setItem(metaKey, JSON.stringify({ savedOfferIds: nextSavedOfferIds }));
        } catch (e) {
            console.error('Failed to save member meta', e);
        }
    };

    const toggleSaveOffer = (offerId) => {
        if (!currentUser) {
            alert('Please complete membership registration first.');
            return;
        }
        const isSaved = savedOfferIds.includes(offerId);
        const nextSaved = isSaved ? savedOfferIds.filter(id => id !== offerId) : [...savedOfferIds, offerId];
        persistSavedOffers(nextSaved);
    };

    const applyToOffer = async (offerId) => {
        if (!currentUser) {
            alert('Please complete membership registration first.');
            return;
        }

        const alreadyApplied = applications.some(app => app.offerId?.toString?.() === offerId || app.offer?._id === offerId);
        if (alreadyApplied) {
            alert('You have already applied for this offer.');
            return;
        }
        try {
            await apiFetch(`/api/offers/${offerId}/apply`, { method: 'POST' });
            const appsRes = await apiFetch('/api/my/applications');
            setApplications(appsRes.applications || []);
            if (!savedOfferIds.includes(offerId)) persistSavedOffers([...savedOfferIds, offerId]);
            alert('Application submitted for this offer!');
        } catch (error) {
            alert(error?.message || 'Failed to apply');
        }
    };

    const handleLogout = () => {
        clearAuthSession();
        navigate('/');
    };

    // --- Render helpers (called as functions, NOT as <Component /> to avoid remount) ---

    const showLabel = isMobile || sidebarOpen;

    const renderNavButton = (id, icon, label, isLogout = false, onClickOverride = null) => {
        const isActive = activeTab === id;
        return (
            <button
                key={id}
                onClick={() => {
                    if (onClickOverride) onClickOverride();
                    else {
                        setActiveTab(id);
                        navigate(`/dashboard${id === 'dashboard' ? '' : `/${id}`}`);
                    }
                    if (isMobile) setSidebarOpen(false);
                }}
                className={`
                    relative w-full flex items-center py-3 px-3.5 rounded-xl transition-all duration-300 group overflow-hidden
                    ${isActive && !isLogout
                        ? 'bg-gradient-to-r from-[#003366] to-[#004080] text-white shadow-md shadow-blue-900/20'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-[#003366]'
                    }
                    ${isLogout ? 'hover:bg-red-50 hover:text-[#D62828] text-gray-500' : ''}
                `}
                title={!showLabel ? label : ''}
            >
                <span className={`flex items-center justify-center transition-all duration-300 z-10 w-6 h-6 ${isActive && !isLogout ? 'text-white' : ''}`}>
                    {React.cloneElement(icon, {
                        fontSize: "medium",
                        className: `transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`
                    })}
                </span>
                <span className={`ml-4 font-medium truncate z-10 text-sm transition-opacity duration-200 ${showLabel ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {label}
                </span>
                {!isMobile && !sidebarOpen && isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#D62828] rounded-r-full" />
                )}
            </button>
        );
    };

    const userInitials = (() => {
        const name = currentMember?.fullName || currentUser?.fullName || '';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        if (parts.length === 1 && parts[0]) return parts[0][0].toUpperCase();
        return 'M';
    })();

    const displayName = currentMember?.fullName || currentUser?.fullName || 'Member';
    const displayRegNo = currentMember?.registrationNumber || currentUser?.registrationNumber || '—';

    const renderTopNavbar = () => (
        <div className="h-20 bg-white/95 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between shadow-sm border-b border-gray-100">
            <div className="flex items-center">
                {isMobile && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <MenuIcon />
                    </button>
                )}
                <img
                    src={logo}
                    alt="IAESTE"
                    className="h-8 md:h-12 w-auto object-contain mr-4 md:mr-6"
                />
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 capitalize border-l border-gray-200 pl-4 md:pl-6 truncate max-w-[150px] md:max-w-none">
                    {activeTab}
                </h2>
            </div>
            <div className="flex items-center space-x-2 md:space-x-6">
                <div className="relative hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-[#003366]/20 transition-all w-48 lg:w-64" />
                </div>
                <div
                    className="relative cursor-pointer"
                    onClick={() => { setActiveTab('notifications'); navigate('/dashboard/notifications'); }}
                >
                    <NotificationsIcon className="text-gray-600 hover:text-[#003366] transition-colors" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-[#D62828] rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white px-1">
                            {notifications.length > 99 ? '99+' : notifications.length}
                        </span>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative pl-4 border-l border-gray-200">
                    <button
                        type="button"
                        onClick={() => setProfileDropdownOpen(prev => !prev)}
                        className="flex items-center space-x-2 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                            <p className="text-xs text-[#003366]">{displayRegNo}</p>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-[#003366] to-[#005a8f] flex items-center justify-center text-white font-bold text-sm md:text-base">
                            {userInitials}
                        </div>
                        <ArrowDownIcon
                            className="text-gray-400 hidden md:block transition-transform duration-200"
                            style={{ fontSize: 18, transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                    </button>

                    <AnimatePresence>
                        {profileDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setProfileDropdownOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[70]"
                                >
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                                        <p className="text-xs text-gray-500 truncate">{displayRegNo}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileDropdownOpen(false);
                                            setActiveTab('profile');
                                            navigate('/dashboard/profile');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#003366] transition-colors"
                                    >
                                        <ProfileIcon style={{ fontSize: 18 }} />
                                        My Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileDropdownOpen(false);
                                            setActiveTab('settings');
                                            navigate('/dashboard/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#003366] transition-colors"
                                    >
                                        <SettingsIcon style={{ fontSize: 18 }} />
                                        Settings
                                    </button>
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileDropdownOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogoutIcon style={{ fontSize: 18 }} />
                                            Logout
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );

    const bannerVisible = showNotificationBanner && notifications.length > 0;

    const marqueeSpeed = Math.max(15, notifications.length * 6);

    // --- Views ---

    const DashboardView = () => (
        <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Total Offers" value={offers.length} icon={<OffersIcon />} color="#003366" />
                <StatCard title="Applied" value={applications.length} icon={<ApplicationsIcon />} color="#D62828" />
                <StatCard title="Shortlisted" value="3" icon={<CheckCircleIcon />} color="#10B981" />
                <StatCard title="Profile Status" value={currentMember ? 'Complete' : 'Pending'} icon={<ProfileIcon />} color="#F59E0B" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Offers by Country</h3>
                    <div className="h-64 w-full">
                        <Bar
                            data={{
                                labels: ['Germany', 'Poland', 'Switzerland', 'India', 'USA', 'Japan'],
                                datasets: [{
                                    label: 'Offers',
                                    data: [120, 98, 86, 75, 60, 45],
                                    backgroundColor: '#003366',
                                    borderRadius: 6,
                                }]
                            }}
                            options={{ maintainAspectRatio: false, responsive: true }}
                        />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Notifications</h3>
                    <div className="space-y-4">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-gray-500">No notifications yet</p>
                        ) : (
                            notifications.slice(0, 5).map((note) => {
                                const d = note.createdAt ? new Date(note.createdAt) : null;
                                const timeStr = d ? (d.toLocaleDateString() + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })) : '';
                                return (
                                    <div key={note._id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                                        <div className="w-2 h-2 mt-2 rounded-full mr-3 bg-[#003366] flex-shrink-0"></div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{note.title}</p>
                                                    {note.body && <p className="text-xs text-gray-600 mt-0.5 break-words whitespace-pre-wrap">{note.body}</p>}
                                                    <p className="text-xs text-gray-500 mt-1">{timeStr}</p>
                                                </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {notifications.length > 5 && (
                        <button onClick={() => setActiveTab('notifications')} className="w-full mt-4 text-sm text-[#003366] font-semibold hover:underline">View All</button>
                    )}
                </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Application Activity</h3>
                <div className="h-64 w-full">
                    <Line
                        data={{
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                            datasets: [{
                                label: 'Applications Sent',
                                data: [2, 5, 8, 12, 10, 15],
                                borderColor: '#D62828',
                                tension: 0.4,
                                fill: true,
                                backgroundColor: 'rgba(214, 40, 40, 0.1)'
                            }]
                        }}
                        options={{ maintainAspectRatio: false, responsive: true }}
                    />
                </div>
            </div>
        </div>
    );

    const StatCard = ({ title, value, icon, color }) => (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-bold mt-2 text-gray-800">{value}</h3>
                </div>
                <div className="p-3 rounded-xl bg-opacity-10" style={{ backgroundColor: `${color}20`, color: color }}>
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold" style={{ color: color }}>
                <span>+12%</span>
                <span className="text-gray-400 ml-1 font-normal">from last month</span>
            </div>
        </motion.div>
    );

    const ProfileField = ({ label, value }) => (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-medium text-gray-800 break-words">{value || '-'}</p>
        </div>
    );

    

    const ProfileView = () => {
        const [currentPassword, setCurrentPassword] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [pwMessage, setPwMessage] = useState('');
        const [pwError, setPwError] = useState('');
        const [pwLoading, setPwLoading] = useState(false);

        if (!currentMember) {
            return (
                <div className="flex items-center justify-center h-96 text-gray-400">
                    <div className="text-center">
                        <ProfileIcon style={{ fontSize: 64, opacity: 0.5 }} />
                        <p className="mt-4 text-lg">No membership details found.</p>
                        <p className="text-sm">Please complete the registration form to see your profile here.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Member Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <ProfileField label="Full Name" value={currentMember.fullName} />
                        <ProfileField label="Registration/Roll No." value={currentMember.registrationNumber} />
                        <ProfileField label="Email Address" value={currentMember.email} />
                        <ProfileField label="WhatsApp No." value={currentMember.whatsappNumber} />
                        <ProfileField label="Course" value={currentMember.course} />
                        <ProfileField label="Branch & Section" value={currentMember.branchSection} />
                        <ProfileField label="Current Semester" value={currentMember.semester} />
                        <ProfileField
                            label="Type of Membership"
                            value={currentMember.memberType ? currentMember.memberType.replace('-', ' ') : ''}
                        />
                        <ProfileField
                            label="Do you have a passport?"
                            value={
                                currentMember.hasPassport
                                    ? currentMember.hasPassport === 'yes'
                                        ? 'Yes'
                                        : 'No'
                                    : 'Not specified'
                            }
                        />
                    </div>
                </div>

                {currentMember.memberType === 'out-station' && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">University Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <ProfileField label="University Name" value={currentMember.universityName} />
                            <ProfileField label="State" value={currentMember.universityState} />
                            <ProfileField label="City" value={currentMember.universityCity} />
                            <ProfileField label="Pincode" value={currentMember.universityPincode} />
                            <ProfileField label="Address" value={currentMember.universityAddress} />
                        </div>
                    </div>
                )}

                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-xs text-gray-700">
                    <p className="font-semibold text-yellow-800">Note</p>
                    <p className="mt-1">
                        Fees once paid is not refundable under any circumstances.
                    </p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Change Password</h3>
                    <p className="text-sm text-gray-500 mb-4">Enter your current password to set a new one.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20 focus:border-[#0B3D59]"
                                placeholder="••••••••"
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
                    <div className="mt-4 flex items-center justify-between">
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
                                        body: {
                                            currentPassword,
                                            newPassword
                                        }
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
        );
    };

    const OffersView = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map(offer => {
                const offerId = offer._id || offer.id;
                const isSaved = savedOfferIds.includes(offerId);
                const isApplied = applications.some(app => (app.offerId?.toString?.() || app.offerId) === offerId || app.offer?._id === offerId);
                return (
                    <motion.div
                        key={offerId}
                        whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative group cursor-pointer flex flex-col h-full"
                        onClick={() => setSelectedOffer(offer)}
                    >
                        {/* Status Tags */}
                        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
                            <div className="flex gap-2">
                                {isApplied && (
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full">
                                        APPLIED
                                    </span>
                                )}
                            </div>
                            {offer.urgent && (
                                <span className="bg-[#D62828]/10 text-[#D62828] text-[10px] font-bold px-3 py-1 rounded-full">
                                    DEADLINE APPROACHING
                                </span>
                            )}
                        </div>

                        {/* Company Header */}
                        <div className="flex items-center mb-4">
                            <span className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#003366] text-2xl mr-4 shadow-sm border border-blue-100/50">
                                <OffersIcon fontSize="inherit" />
                            </span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 group-hover:text-[#003366] transition-colors">
                                    {offer.offerNumber || offer.company}
                                </h3>
                                <p className="text-sm text-gray-500">{offer.country}</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-6 flex-1">
                            <h4 className="font-semibold text-gray-700 min-h-[48px] leading-snug line-clamp-2">{offer.position}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center text-xs text-gray-600">
                                    <TimeIcon className="w-4 h-4 mr-2 text-gray-400" /> {offer.duration}
                                </div>
                                <div className="flex items-center text-xs text-gray-600">
                                    <StipendIcon className="w-4 h-4 mr-2 text-gray-400" /> {offer.stipend}
                                </div>
                                <div className="flex items-center text-xs text-gray-600 truncate">
                                    <FieldIcon className="w-4 h-4 mr-2 text-gray-400" /> {offer.field}
                                </div>
                                <div className="flex items-center text-xs font-bold text-[#D62828]">
                                    <CalendarIcon className="w-4 h-4 mr-2 text-[#D62828]/60" /> {offer.deadline}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                                    isSaved
                                        ? 'bg-[#003366] text-white border-[#003366]'
                                        : 'bg-[#F4F6F8] text-[#003366] border-gray-200 hover:bg-[#003366] hover:text-white'
                                }`}
                                onClick={(e) => { e.stopPropagation(); toggleSaveOffer(offerId); }}
                            >
                                {isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button
                                type="button"
                                className="flex-1 py-2 rounded-lg bg-[#F4F6F8] text-[#003366] font-semibold hover:bg-[#003366] hover:text-white transition-all text-xs"
                                onClick={() => setSelectedOffer(offer)}
                            >
                                View Details
                            </button>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    </div>
);
    

    const SavedOffersView = () => {
        const currentOffers = Array.isArray(offers) ? offers : [];
        const savedOffers = currentOffers.filter(o => savedOfferIds.includes(o._id || o.id));
        if (!savedOffers.length) {
            return (
                <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                        <BookmarkIcon style={{ fontSize: 56, opacity: 0.45 }} />
                        <p className="mt-4 text-lg">No saved offers yet</p>
                        <p className="text-sm">Save offers from the Offers tab to see them here.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedOffers.map(offer => {
                        const offerId = offer._id || offer.id;
                        const isSaved = savedOfferIds.includes(offerId);
                        const isApplied = applications.some(app => (app.offerId?.toString?.() || app.offerId) === offerId || app.offer?._id === offerId);
                        
                        // Calculate Deadline Nearby
                        let isDeadlineNearby = !!offer.deadlineNearby;
                        if (!isDeadlineNearby && offer.deadline) {
                            const deadlineDate = new Date(offer.deadline);
                            const today = new Date();
                            const diffTime = deadlineDate - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays >= 0 && diffDays <= 3) isDeadlineNearby = true;
                        }

                        return (
                            <motion.div
                                key={offerId}
                                whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative group cursor-pointer flex flex-col h-full"
                                onClick={() => setSelectedOffer(offer)}
                            >
                                {/* Status Tags Container */}
                                <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
                                    <div className="flex gap-2">
                                        {isApplied && (
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full">
                                                APPLIED
                                            </span>
                                        )}
                                    </div>
                                    {offer.urgent && (
                                        <span className="bg-[#D62828]/10 text-[#D62828] text-[10px] font-bold px-3 py-1 rounded-full">
                                            DEADLINE APPROACHING
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center mb-4">
                                    <span className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#003366] text-2xl mr-4 shadow-sm border border-blue-100/50">
                                        <OffersIcon fontSize="inherit" />
                                    </span>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-[#003366] transition-colors">{offer.offerNumber || offer.company}</h3>
                                        <p className="text-sm text-gray-500">{offer.country}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-6 flex-1">
                                    <h4 className="font-semibold text-gray-700 min-h-[48px] leading-snug line-clamp-2">{offer.position}</h4>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <TimeIcon className="w-4 h-4 mr-2 text-gray-400" /> {offer.duration}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <StipendIcon className="w-4 h-4 mr-2 text-gray-400" /> {offer.stipend}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FieldIcon className="w-4 h-4 mr-2 text-gray-400" /> {offer.field}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${isSaved
                                            ? 'bg-[#003366] text-white border-[#003366]'
                                            : 'bg-[#F4F6F8] text-[#003366] border-gray-200 hover:bg-[#003366] hover:text-white'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSaveOffer(offerId);
                                        }}
                                    >
                                        {isSaved ? 'Saved' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 py-2 rounded-lg bg-[#F4F6F8] text-[#003366] font-semibold hover:bg-[#003366] hover:text-white transition-all text-xs"
                                        onClick={() => setSelectedOffer(offer)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
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
                            <p className="text-[11px] text-gray-500">You must enter your current password to change it.</p>
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

    const OfferDetailModal = ({ offer, onClose }) => {
        const [detailTab, setDetailTab] = useState('Overview');
        if (!offer) return null;
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-[#003366] p-6 md:p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-start">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-3xl md:text-4xl mr-6 shadow-xl mb-4 md:mb-0 border border-white/20">
                                <OffersIcon fontSize="inherit" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-2">{offer.position}</h2>
                                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-blue-100 space-y-1 md:space-y-0">
                                    <span className="flex items-center"><CompanyIcon className="w-4 h-4 mr-1" /> {offer.offerNumber || offer.company}</span>
                                    <span className="flex items-center"><LocationIcon className="w-4 h-4 mr-1" /> {offer.country}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs - Scrollable on mobile */}
                    <div className="flex border-b border-gray-200 px-4 md:px-8 bg-white sticky top-0 z-10 overflow-x-auto hide-scrollbar">
                        {['Overview', 'Description', 'Requirements'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setDetailTab(tab)}
                                className={`px-4 md:px-6 py-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${detailTab === tab ? 'text-[#003366]' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                                {detailTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003366]"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={detailTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {detailTab === 'Overview' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                                        <div className="col-span-1 md:col-span-2 space-y-6">
                                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                                <h3 className="text-lg font-bold text-[#003366] mb-4">At a Glance</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="flex items-center text-gray-700">
                                                        <div className="p-2 bg-blue-50 rounded-lg mr-3 text-[#003366]"><CompanyIcon /></div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Employer</p>
                                                            <p className="font-semibold">{offer.company}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-gray-700">
                                                        <div className="p-2 bg-blue-50 rounded-lg mr-3 text-[#003366]"><LocationIcon /></div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Location</p>
                                                            <p className="font-semibold">{offer.country}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-gray-700">
                                                        <div className="p-2 bg-blue-50 rounded-lg mr-3 text-[#003366]"><TimeIcon /></div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Period</p>
                                                            <p className="font-semibold">{offer.duration}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-gray-700">
                                                        <div className="p-2 bg-blue-50 rounded-lg mr-3 text-[#003366]"><StipendIcon /></div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Stipend</p>
                                                            <p className="font-semibold">{offer.stipend}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Deadline</h4>
                                                <p className="text-3xl font-bold text-[#D62828] mb-2">{offer.deadline}</p>
                                                <p className="text-sm text-gray-500">Applications close automatically at midnight.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {detailTab === 'Description' && (
                                    <div className="space-y-6 max-w-3xl">
                                        <section>
                                            <h3 className="text-lg font-bold text-[#003366] mb-3">About the Role</h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                As a {offer.position} at {offer.company}, you will work directly with our engineering teams to build scalable solutions. You will participate in code reviews, design discussions, and contribute to our core products.
                                            </p>
                                        </section>
                                        <section>
                                            <h3 className="text-lg font-bold text-[#003366] mb-3">Key Responsibilities</h3>
                                            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
                                                <li>Collaborate with cross-functional teams to define, design, and ship new features.</li>
                                                <li>Unit-test code for robustness, including edge cases, usability, and general reliability.</li>
                                                <li>Work on bug fixing and improving application performance.</li>
                                                <li>Continuously discover, evaluate, and implement new technologies to maximize development efficiency.</li>
                                            </ul>
                                        </section>
                                    </div>
                                )}

                                {detailTab === 'Requirements' && (
                                    <div className="space-y-6 max-w-3xl">
                                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                            <h3 className="text-lg font-bold text-[#003366] mb-3">Academic Requirements</h3>
                                            <ul className="space-y-3">
                                                <li className="flex items-start">
                                                    <CheckCircleIcon className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-700">Currently enrolled in {offer.field} or related degree</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <CheckCircleIcon className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-700">Completed at least 4 semesters of study</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-[#003366] mb-3">Skills & Competencies</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {['JavaScript', 'React', 'Node.js', 'Teamwork', 'English B2', 'Problem Solving'].map(skill => (
                                                    <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex space-x-3 w-full md:w-auto">
                            <button
                                className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const path = offer.pdfPath;
                                    if (path) {
                                        window.open(`${API_BASE_URL}${path}`, '_blank');
                                    } else {
                                        alert('No PDF attached for this offer');
                                    }
                                }}
                            >
                                <DownloadIcon className="w-4 h-4 mr-2" /> PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleSaveOffer(offer._id || offer.id)}
                                className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <BookmarkIcon className="w-4 h-4 mr-2" /> Save
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                applyToOffer(offer._id || offer.id);
                                onClose();
                            }}
                            className="w-full md:w-auto flex items-center justify-center px-8 py-3 bg-[#D62828] text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Apply Now <SendIcon className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    };

    const NotificationsListView = () => (
        <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800">All Notifications</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <NotificationsIcon style={{ fontSize: 48, opacity: 0.5 }} className="mb-4" />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((note) => {
                            const d = note.createdAt ? new Date(note.createdAt) : null;
                            const dateStr = d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                            const timeStr = d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                            return (
                                <div key={note._id} className="p-4 md:p-6 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex gap-3 items-start">
                                        <div className="w-3 h-3 rounded-full bg-[#003366] mt-1.5 flex-shrink-0" />
                                        <div className="min-w-0 w-full">
                                            <p className="font-semibold text-gray-800 break-words whitespace-normal">{note.title}</p>
                                            {note.body && <p className="text-sm text-gray-600 mt-1 break-words whitespace-normal">{note.body}</p>}
                                            <p className="text-xs text-gray-500 mt-2">{dateStr} • {timeStr}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
    const MyApplicationsView = () => {
        const rows = (applications || []).map((app) => ({
            app,
            offer: app.offer || offers.find(o => (o._id || o.id) === (app.offerId || app.offer?._id)) || {}
        }));

        if (rows.length === 0) return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">No applications yet</div>
        );

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-white border-b">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Position</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Country</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Applied On</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map(({ offer, app }) => {
                                const date = app.createdAt ? app.createdAt.slice(0, 10) : '-';
                                return (
                                    <tr key={`${app._id || app.offerId}-${date}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800 text-sm">{offer?.position || '-'}</p>
                                            <p className="text-xs text-gray-500">{offer?.company || ''}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{offer?.country || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                app.status === 'Employer Checked' ? 'bg-green-100 text-green-700' :
                                                app.status === 'Proceed to Nomination Packet' ? 'bg-purple-100 text-purple-700' :
                                                app.status === 'Selected at LC Level' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                                {app.status || 'Received'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const DocumentsView = () => {
        const handleDownloadPDF = (filename) => {
            const link = document.createElement('a');
            const encodedFilename = encodeURIComponent(filename);
            link.href = `/documents/${encodedFilename}`;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const handleViewPDF = (filename) => {
            const encodedFilename = encodeURIComponent(filename);
            window.open(`/documents/${encodedFilename}`, '_blank');
        };

        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Document Guidelines</h3>
                    <p className="text-gray-600 mb-6">Follow these steps to prepare your application documents for IAESTE offers.</p>
                </div>

                {/* Step 1: Factsheet Creation */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#003366] to-[#004080] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            1
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <ArticleIcon className="text-[#003366]" />
                                Factsheet Creation
                            </h4>
                            <div className="space-y-4 text-gray-700">
                                <p className="leading-relaxed">
                                    A <strong className="text-[#003366]">Factsheet</strong> is a comprehensive document that showcases your academic achievements, skills, work experience, and co-scholastic activities. It serves as your professional profile and is the <strong className="text-[#D62828]">most important part</strong> of applying to any IAESTE offer.
                                </p>
                                <div className="bg-blue-50 border-l-4 border-[#003366] p-4 rounded-r-lg">
                                    <div className="flex items-start gap-3">
                                        <InfoIcon className="text-[#003366] flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-[#003366] mb-1">Why is Factsheet Important?</p>
                                            <p className="text-sm text-gray-700">
                                                Your factsheet is the first thing employers see when reviewing your application. It helps them understand your qualifications, skills, and suitability for the position. A well-prepared factsheet significantly increases your chances of being selected for an offer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <p className="leading-relaxed">
                                    The factsheet includes sections for:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                                    <li>Academic records (Class X, XII, Graduation, Post-Graduation)</li>
                                    <li>Current field of study and semester information</li>
                                    <li>Offer-related skills (Programming languages, courses, MOOCs)</li>
                                    <li>Work experience (Paper presentations, projects, internships)</li>
                                    <li>Co-scholastic activities and achievements</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Sample Document:</p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleViewPDF('Factsheet Format.pdf')}
                                className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors font-medium"
                            >
                                <PdfIcon />
                                View Sample Factsheet
                            </button>
                            <button
                                onClick={() => handleDownloadPDF('Factsheet Format.pdf')}
                                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#003366] text-[#003366] rounded-lg hover:bg-blue-50 transition-colors font-medium"
                            >
                                <DownloadIcon />
                                Download Sample
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step 2: Nomination Packet */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#D62828] to-[#E63946] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            2
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <ArticleIcon className="text-[#D62828]" />
                                Nomination Packet
                            </h4>
                            <div className="space-y-4 text-gray-700">
                                <p className="leading-relaxed">
                                    Once your <strong className="text-[#003366]">Factsheet is selected</strong> for an offer, you need to create a <strong className="text-[#D62828]">Nomination Packet</strong>. This packet contains all the necessary documents required by the host country and employer to process your internship application.
                                </p>
                                <div className="bg-red-50 border-l-4 border-[#D62828] p-4 rounded-r-lg">
                                    <div className="flex items-start gap-3">
                                        <InfoIcon className="text-[#D62828] flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-[#D62828] mb-1">What's Included?</p>
                                            <p className="text-sm text-gray-700">
                                                The nomination packet typically includes offer forms, CV, cover letter, transcripts, language certificates, passport copies, recommendation letters, and other country-specific requirements. Each country may have slightly different document requirements.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <p className="leading-relaxed">
                                    Common documents in a nomination packet include:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                                    <li>Offer form and SNF (Student Nomination Form)</li>
                                    <li>Cover letter and CV</li>
                                    <li>Academic transcripts and list of subjects</li>
                                    <li>Language certificates</li>
                                    <li>Bonafide certificate and Certificate of Enrollment</li>
                                    <li>Letters of recommendation</li>
                                    <li>Relevant certificates (up to 5)</li>
                                    <li>Passport copies (first and last page)</li>
                                    <li>Passport size photo</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Sample Document:</p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleViewPDF('Documents required.pdf')}
                                className="flex items-center gap-2 px-4 py-2 bg-[#D62828] text-white rounded-lg hover:bg-[#E63946] transition-colors font-medium"
                            >
                                <PdfIcon />
                                View Sample Nomination Packet
                            </button>
                            <button
                                onClick={() => handleDownloadPDF('Documents required.pdf')}
                                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#D62828] text-[#D62828] rounded-lg hover:bg-red-50 transition-colors font-medium"
                            >
                                <DownloadIcon />
                                Download Sample
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <InfoIcon className="text-yellow-700 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-yellow-800 mb-2">Important Notes:</p>
                            <ul className="text-sm text-yellow-900 space-y-1 list-disc list-inside ml-2">
                                <li>Ensure all documents are properly formatted and clearly readable</li>
                                <li>Follow the exact format shown in the sample documents</li>
                                <li>Submit documents well before the deadline</li>
                                <li>Some countries may require hard copies for visa applications</li>
                                <li>Contact your Local Committee if you have any questions</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Main Render ---

    // Calculate main margin based on sidebar state
    const mainMargin = isMobile ? 'ml-0' : (sidebarOpen ? 'ml-[280px]' : 'ml-[88px]');

    return (
        <div className="min-h-screen bg-[#F4F6F8] font-sans flex text-[#1F2937] relative">

            {/* Top Navbar */}
            <div className="fixed top-0 left-0 right-0 z-50">
                {renderTopNavbar()}
            </div>

            {/* Notification Banner */}
            {bannerVisible && (
                <div className="fixed top-20 right-0 z-[45] transition-all duration-300 ease-in-out" style={{ left: isMobile ? 0 : (sidebarOpen ? 280 : 88) }}>
                    <div className="h-10 bg-gradient-to-r from-[#003366] via-[#004080] to-[#003366] flex items-center overflow-hidden relative shadow-sm">
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#003366] to-transparent z-10 pointer-events-none" />
                        <div className="flex-1 overflow-hidden">
                            <div className="animate-marquee" style={{ animation: `marquee ${marqueeSpeed}s linear infinite` }}>
                                {notifications.map((n, i) => (
                                    <span key={n._id || i} className="inline-flex items-center mx-6 text-sm">
                                        <span className="w-1.5 h-1.5 bg-[#D62828] rounded-full mr-2 flex-shrink-0" />
                                        <span className="font-semibold text-white">{n.title}</span>
                                        {n.body && <span className="text-blue-200 ml-2 font-normal">— {n.body}</span>}
                                        <span className="text-blue-300/50 mx-6">|</span>
                                    </span>
                                ))}
                                {notifications.map((n, i) => (
                                    <span key={`dup-${n._id || i}`} className="inline-flex items-center mx-6 text-sm">
                                        <span className="w-1.5 h-1.5 bg-[#D62828] rounded-full mr-2 flex-shrink-0" />
                                        <span className="font-semibold text-white">{n.title}</span>
                                        {n.body && <span className="text-blue-200 ml-2 font-normal">— {n.body}</span>}
                                        <span className="text-blue-300/50 mx-6">|</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#003366] to-transparent z-10 pointer-events-none" />
                        <button onClick={() => setShowNotificationBanner(false)} className="flex-shrink-0 p-1 mr-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20 relative" title="Dismiss notifications banner">
                            <CloseIcon style={{ fontSize: 16 }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar */}
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
                transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.8 }}
                className={`fixed left-0 top-0 h-full bg-white ${isMobile ? 'z-[70]' : 'z-40'} flex flex-col border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] pt-20 overflow-hidden`}
            >
                <div className="flex-1 py-6 px-3 space-y-2 overflow-hidden">
                    <p className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200 ${!isMobile && !sidebarOpen ? 'opacity-0 hidden' : 'opacity-100 delay-100'}`}>Menu</p>
                    {renderNavButton("dashboard", <DashboardIcon />, "Dashboard")}
                    {renderNavButton("offers", <OffersIcon />, "Offers")}
                    {renderNavButton("applications", <ApplicationsIcon />, "My Applications")}
                    {renderNavButton("nomination", <NominationIcon />, "Nomination")}
                    <div className={`my-3 border-t border-gray-100 mx-2 transition-opacity duration-200 ${!isMobile && !sidebarOpen ? 'opacity-0' : 'opacity-100'}`}></div>
                    {renderNavButton("notifications", <NotificationsIcon />, "Notifications")}
                    <p className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200 ${!isMobile && !sidebarOpen ? 'opacity-0 hidden' : 'opacity-100 delay-100'}`}>Records</p>
                    {renderNavButton("documents", <DocumentsIcon />, "Documents")}
                    {/* Analytics removed */}
                    {renderNavButton("saved", <BookmarkIcon />, "Saved Offers")}
                </div>
                <div className="p-3 border-t border-gray-100 space-y-1 bg-gray-50/50">
                    {renderNavButton("settings", <SettingsIcon />, "Settings")}
                    {renderNavButton("logout", <LogoutIcon />, "Logout", true, handleLogout)}
                </div>
                {!isMobile && (
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="absolute -right-3 top-24 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md text-[#003366] hover:bg-[#003366] hover:text-white transition-all duration-200 z-50 transform hover:scale-110"
                    >
                        {sidebarOpen ? <ChevronLeftIcon style={{ fontSize: 16 }} /> : <ChevronRightIcon style={{ fontSize: 16 }} />}
                    </button>
                )}
            </motion.aside>

            <div className={`flex-1 transition-all duration-300 ease-in-out ${bannerVisible ? 'pt-[120px]' : 'pt-20'} ${mainMargin}`}>
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
                            {activeTab === 'applications' && <MyApplicationsView />}
                            {activeTab === 'saved' && <SavedOffersView />}
                            {activeTab === 'profile' && <ProfileView />}
                            {activeTab === 'settings' && <SettingsView />}
                            {activeTab === 'notifications' && <NotificationsListView />}
                            {activeTab === 'documents' && <DocumentsView />}
                            {activeTab !== 'dashboard' && activeTab !== 'offers' && activeTab !== 'applications' && activeTab !== 'profile' && activeTab !== 'settings' && activeTab !== 'notifications' && activeTab !== 'documents' && (
                                <div className="flex items-center justify-center h-96 text-gray-400">
                                    <div className="text-center">
                                        <NominationIcon style={{ fontSize: 64, opacity: 0.5 }} />
                                        <p className="mt-4 text-lg">Section under development</p>
                                        <p className="text-sm">Check back soon!</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <AnimatePresence>
                {selectedOffer && (
                    <OfferDetailModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
