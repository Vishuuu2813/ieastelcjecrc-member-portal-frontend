import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Visibility as VisibilityIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { apiFetch } from '../../utils/api';

function DetailRow({ label, value }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-medium text-gray-800 break-words">{value || '-'}</p>
        </div>
    );
}

function MemberDetailModal({ data, onClose, onApplicationUpdated }) {
    const [updatingId, setUpdatingId] = useState(null);
    const [editStatus, setEditStatus] = useState({});
    const [editReason, setEditReason] = useState({});
    const [newPass, setNewPass] = useState('');
    const [resetting, setResetting] = useState(false);

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
                body: { status, rejectionReason: status === 'Rejected' ? reason : '' },
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

    const handleResetPassword = async () => {
        if (!newPass || newPass.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }
        if (!window.confirm(`Are you sure you want to reset the password for ${membership.fullName}? The member will need to use this new password to login.`)) {
            return;
        }
        try {
            setResetting(true);
            await apiFetch(`/api/admin/members/${membership._id}/password`, {
                method: 'PATCH',
                body: { newPassword: newPass },
            });
            alert('Password updated successfully!');
            setNewPass('');
        } catch (e) {
            alert(e?.message || 'Failed to update password');
        } finally {
            setResetting(false);
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
                    <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
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
                            {membership?.createdAt && <DetailRow label="Joined" value={new Date(membership.createdAt).toLocaleString('en-IN')} />}
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-red-800 mb-4">Account Security (Admin Override)</h4>
                        <div className="flex flex-col md:flex-row items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Set New Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter new password (min 6 chars)"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={resetting || !newPass}
                                className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {resetting ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                        <p className="mt-2 text-[10px] text-red-600 italic">
                            * This will immediately change the member's login password. They will be logged out of other devices eventually.
                        </p>
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
                                            <td className="py-3 text-sm">{app.offer?.offerNumber ? `${app.offer.offerNumber} • ` : ''}{app.offer?.company || '-'}</td>
                                            <td className="py-3">
                                                {updatingId === app._id ? (
                                                    <span className="text-xs text-gray-500">Updating...</span>
                                                ) : (
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-semibold ${
                                                            app.status === 'Selected' ? 'bg-green-100 text-green-700' :
                                                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            app.status === 'Shortlisted' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-50 text-blue-700'
                                                        }`}
                                                    >
                                                        {app.status || 'Submitted'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-sm text-gray-600">{app.status === 'Rejected' && app.rejectionReason ? app.rejectionReason : '-'}</td>
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
                                                        type="button"
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
}

export default function Members() {
    const [members, setMembers] = useState([]);
    const [filters, setFilters] = useState({ search: '', type: 'all', passport: 'all' });
    const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);
    const [memberDetailLoading, setMemberDetailLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const loadMembers = () => {
        setLoadError('');
        setLoading(true);
        apiFetch('/api/admin/memberships')
            .then((r) => {
                const list = r?.memberships ?? r?.members ?? [];
                setMembers(Array.isArray(list) ? list : []);
            })
            .catch((err) => {
                setLoadError(err?.message || 'Failed to load members.');
                setMembers([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadMembers();
    }, []);

    const approvedOnly = members.filter((m) => (m.status || '') === 'Approved');
    const normalizedSearch = (filters.search || '').trim().toLowerCase();
    const filteredMembers = approvedOnly.filter((m) => {
        const matchesSearch =
            !normalizedSearch ||
            [m.fullName, m.registrationNumber, m.email, m.whatsappNumber].filter(Boolean).some((v) => v.toLowerCase().includes(normalizedSearch));
        if (!matchesSearch) return false;
        if (filters.type !== 'all' && (m.memberType || '') !== filters.type) return false;
        if (filters.passport === 'yes' && m.hasPassport !== 'yes') return false;
        if (filters.passport === 'no' && m.hasPassport !== 'no') return false;
        return true;
    });

    const handleFilterChange = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

    const openMemberDetail = (member) => {
        setMemberDetailLoading(true);
        setSelectedMemberDetail(null);
        apiFetch(`/api/admin/members/${member._id}/detail`)
            .then((data) => setSelectedMemberDetail(data))
            .catch((e) => alert(e?.message || 'Failed to load member'))
            .finally(() => setMemberDetailLoading(false));
    };

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-xl font-bold text-gray-800">Members Directory</h3>
                    <button
                        type="button"
                        onClick={loadMembers}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-[#0B3D59] text-[#0B3D59] text-sm font-semibold hover:bg-[#0B3D59] hover:text-white disabled:opacity-60 transition-colors"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
                {loadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{loadError}</div>
                )}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Member</label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search by name, roll no, email..."
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D59]/20"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Membership Type</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                >
                                    <option value="all">All</option>
                                    <option value="in-station">In-Station</option>
                                    <option value="out-station">Out-Station</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Passport</label>
                                <select
                                    value={filters.passport}
                                    onChange={(e) => handleFilterChange('passport', e.target.value)}
                                    className="w-full md:w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
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
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading members...</td>
                                    </tr>
                                ) : filteredMembers.map((member) => {
                                    const createdAt = member.createdAt ? new Date(member.createdAt) : null;
                                    const dateStr = createdAt ? createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                                    const timeStr = createdAt ? createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                                    return (
                                        <tr key={member._id || member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-800">{member.fullName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{member.registrationNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{member.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 capitalize">{member.memberType?.replace('-', ' ') || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {member.hasPassport === 'yes' ? 'Yes' : member.hasPassport === 'no' ? 'No' : 'Not specified'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{dateStr}{timeStr ? ` • ${timeStr}` : ''}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => openMemberDetail(member)}
                                                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#0B3D59] text-white text-xs font-semibold hover:bg-[#09314a] transition-colors"
                                                    title="View full profile, offer applications & progress"
                                                >
                                                    <VisibilityIcon style={{ fontSize: 14 }} className="mr-1" /> View progress
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredMembers.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                                            No approved members yet. Approve members from the Approve Members page.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>

            {memberDetailLoading && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
                    <div className="text-white font-semibold">Loading member details...</div>
                </div>
            )}
            {selectedMemberDetail && (
                <MemberDetailModal
                    data={selectedMemberDetail}
                    onClose={() => setSelectedMemberDetail(null)}
                    onApplicationUpdated={(updated) => updated && setSelectedMemberDetail(updated)}
                />
            )}
        </>
    );
}
