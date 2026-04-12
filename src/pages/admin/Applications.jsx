import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Assignment as ApplicationsIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    School as SchoolIcon,
    Badge as BadgeIcon,
    Work as WorkIcon,
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    AttachMoney as StipendIcon,
    CalendarMonth as CalendarIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { apiFetch } from '../../utils/api';

const STATUS_COLORS = {
    'Received': 'bg-blue-50 text-blue-700 ring-blue-200',
    'Selected at LC Level': 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    'Employer Checked': 'bg-green-50 text-green-700 ring-green-200',
    'Proceed to Nomination Packet': 'bg-purple-50 text-purple-700 ring-purple-200',
};

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedApp, setSelectedApp] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/admin/applications');
            setApplications(res.applications || []);
        } catch (err) {
            console.error('Failed to load applications', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (appId, newStatus) => {
        try {
            setUpdatingStatus(true);
            await apiFetch(`/api/admin/applications/${appId}`, {
                method: 'PATCH',
                body: { status: newStatus },
            });
            setApplications(prev =>
                prev.map(a => (a._id === appId ? { ...a, status: newStatus } : a))
            );
            if (selectedApp && selectedApp._id === appId) {
                setSelectedApp(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert(err?.message || 'Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const filtered = applications.filter(app => {
        const member = app.membershipApplicationId || app.userId || {};
        const offer = app.offerId || {};
        const term = search.toLowerCase();

        const matchSearch =
            !term ||
            (member.fullName || '').toLowerCase().includes(term) ||
            (member.registrationNumber || '').toLowerCase().includes(term) ||
            (member.email || '').toLowerCase().includes(term) ||
            (offer.position || '').toLowerCase().includes(term) ||
            (offer.offerNumber || '').toLowerCase().includes(term) ||
            (offer.company || '').toLowerCase().includes(term) ||
            (offer.country || '').toLowerCase().includes(term);

        const matchStatus = statusFilter === 'all' || app.status === statusFilter;

        return matchSearch && matchStatus;
    });

    const stats = {
        total: applications.length,
        received: applications.filter(a => a.status === 'Received').length,
        selectedLC: applications.filter(a => a.status === 'Selected at LC Level').length,
        employerChecked: applications.filter(a => a.status === 'Employer Checked').length,
        proceedNomination: applications.filter(a => a.status === 'Proceed to Nomination Packet').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: '#003366' },
                    { label: 'Received', value: stats.received, color: '#3B82F6' },
                    { label: 'Selected @ LC', value: stats.selectedLC, color: '#F59E0B' },
                    { label: 'Employer Checked', value: stats.employerChecked, color: '#10B981' },
                    { label: 'Proceed to Nomination', value: stats.proceedNomination, color: '#8B5CF6' },
                ].map(s => (
                    <div
                        key={s.label}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setStatusFilter(s.label === 'Total' ? 'all' : s.label)}
                    >
                        <p className="text-xs font-semibold text-gray-500 uppercase">{s.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 20 }} />
                    <input
                        type="text"
                        placeholder="Search by name, reg no, email, offer, company, country..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <FilterIcon className="text-gray-400" style={{ fontSize: 20 }} />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                    >
                        <option value="all">All Status</option>
                        <option value="Received">Received</option>
                        <option value="Selected at LC Level">Selected at LC Level</option>
                        <option value="Employer Checked">Employer Checked</option>
                        <option value="Proceed to Nomination Packet">Proceed to Nomination Packet</option>
                    </select>
                </div>
            </div>

            {/* Applications Table */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl p-16 shadow-sm border border-gray-100 text-center text-gray-400">
                    <ApplicationsIcon style={{ fontSize: 56, opacity: 0.5 }} />
                    <p className="mt-4 text-lg font-medium">No applications found</p>
                    <p className="text-sm">
                        {applications.length === 0
                            ? 'No members have applied to any offers yet.'
                            : 'Try adjusting your search or filter.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">#</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Applicant</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Offer</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Country</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Applied On</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((app, idx) => {
                                    const member = app.membershipApplicationId || app.userId || {};
                                    const offer = app.offerId || {};
                                    const date = app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                                    const statusClass = STATUS_COLORS[app.status] || 'bg-gray-50 text-gray-700';

                                    return (
                                        <tr key={app._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-4 text-sm text-gray-400 font-mono">{idx + 1}</td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-gray-800">{member.fullName || '-'}</p>
                                                <p className="text-xs text-gray-500">{member.registrationNumber || member.email || ''}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-gray-800">{offer.position || '-'}</p>
                                                <p className="text-xs text-gray-500">{offer.offerNumber ? `${offer.offerNumber} • ` : ''}{offer.company || ''}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm text-gray-700">{offer.country || '-'}</span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{date}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ${statusClass}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    onClick={() => setSelectedApp(app)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003366] text-white text-xs font-semibold hover:bg-[#004080] transition-colors"
                                                >
                                                    <ViewIcon style={{ fontSize: 14 }} />
                                                    View More
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                        Showing {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* View More Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <ApplicationDetailModal
                        app={selectedApp}
                        onClose={() => setSelectedApp(null)}
                        onStatusChange={updateStatus}
                        updating={updatingStatus}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
        <span className="text-gray-400 mt-0.5">{icon}</span>
        <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-gray-800">{value || '-'}</p>
        </div>
    </div>
);

function ApplicationDetailModal({ app, onClose, onStatusChange, updating }) {
    const member = app.membershipApplicationId || app.userId || {};
    const user = app.userId || {};
    const offer = app.offerId || {};
    const appliedDate = app.createdAt
        ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : '-';
    const appliedTime = app.createdAt
        ? new Date(app.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : '';



    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#003366] to-[#004080] p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <CloseIcon style={{ fontSize: 20 }} />
                    </button>
                    <h2 className="text-xl font-bold">Application Details</h2>
                    <p className="text-blue-200 text-sm mt-1">
                        {member.fullName || user.fullName || 'Member'} &mdash; {offer.offerNumber || offer.position || 'Offer'}
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Student Information */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <PersonIcon style={{ fontSize: 18 }} />
                            Student Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <InfoRow icon={<PersonIcon style={{ fontSize: 16 }} />} label="Full Name" value={member.fullName || user.fullName} />
                            <InfoRow icon={<BadgeIcon style={{ fontSize: 16 }} />} label="Registration / Roll No." value={member.registrationNumber || user.registrationNumber} />
                            <InfoRow icon={<EmailIcon style={{ fontSize: 16 }} />} label="Email Address" value={member.email || user.email} />
                            <InfoRow icon={<PhoneIcon style={{ fontSize: 16 }} />} label="WhatsApp Number" value={member.whatsappNumber} />
                            <InfoRow icon={<SchoolIcon style={{ fontSize: 16 }} />} label="Course" value={member.course} />
                            <InfoRow icon={<SchoolIcon style={{ fontSize: 16 }} />} label="Branch & Section" value={member.branchSection} />
                            <InfoRow icon={<CalendarIcon style={{ fontSize: 16 }} />} label="Semester" value={member.semester} />
                            <InfoRow icon={<BadgeIcon style={{ fontSize: 16 }} />} label="Member Type" value={member.memberType ? member.memberType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : undefined} />
                            <InfoRow icon={<BadgeIcon style={{ fontSize: 16 }} />} label="Has Passport" value={member.hasPassport === 'yes' ? 'Yes' : member.hasPassport === 'no' ? 'No' : undefined} />
                        </div>
                    </div>

                    {/* Offer Information */}
                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <WorkIcon style={{ fontSize: 18 }} />
                            Offer Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <InfoRow icon={<BadgeIcon style={{ fontSize: 16 }} />} label="Offer Number" value={offer.offerNumber} />
                            <InfoRow icon={<WorkIcon style={{ fontSize: 16 }} />} label="Position" value={offer.position} />
                            <InfoRow icon={<WorkIcon style={{ fontSize: 16 }} />} label="Employer" value={offer.company} />
                            <InfoRow icon={<LocationIcon style={{ fontSize: 16 }} />} label="Country" value={offer.country} />
                            <InfoRow icon={<TimeIcon style={{ fontSize: 16 }} />} label="Period" value={offer.duration} />
                            <InfoRow icon={<StipendIcon style={{ fontSize: 16 }} />} label="Stipend" value={offer.stipend} />
                            <InfoRow icon={<SchoolIcon style={{ fontSize: 16 }} />} label="Field" value={offer.field} />
                            <InfoRow icon={<CalendarIcon style={{ fontSize: 16 }} />} label="Deadline" value={offer.deadline} />
                        </div>
                    </div>

                    {/* Application Status */}
                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ApplicationsIcon style={{ fontSize: 18 }} />
                            Application Status
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase">Applied On</p>
                                <p className="text-sm font-medium text-gray-800">{appliedDate} {appliedTime && `at ${appliedTime}`}</p>
                            </div>
                            <div className="flex items-center gap-3 sm:ml-auto">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase">Status</p>
                                <select
                                    value={app.status}
                                    disabled={updating}
                                    onChange={e => onStatusChange(app._id, e.target.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-[#003366]/20 ${
                                        app.status === 'Employer Checked' ? 'bg-green-50 text-green-700 border-green-200' :
                                        app.status === 'Proceed to Nomination Packet' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        app.status === 'Selected at LC Level' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        'bg-blue-50 text-blue-700 border-blue-200'
                                    } disabled:opacity-60`}
                                >
                                    <option value="Received">Received</option>
                                    <option value="Selected at LC Level">Selected at LC Level</option>
                                    <option value="Employer Checked">Employer Checked</option>
                                    <option value="Proceed to Nomination Packet">Proceed to Nomination Packet</option>
                                </select>
                            </div>
                        </div>
                        {app.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase">Admin Notes</p>
                                <p className="text-sm text-gray-700 mt-1">{app.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg bg-[#003366] text-white text-sm font-semibold hover:bg-[#004080] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
