// --- PDF EXTRACTION LOGIC UPDATED ---
    import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Cancel as CancelIcon } from '@mui/icons-material';
import axios from 'axios';
import { apiFetch, apiUploadOfferPdf, API_BASE_URL, clearAuthSession } from '../../utils/api';

const mapFieldToCategory = (field) => {
    if (!field) return 'Other';
    const f = field.toLowerCase();
    if (f.includes('computer') || f.includes('software') || f.includes('cs')) return 'CS';
    if (f.includes('information technology') || f.includes('it')) return 'IT';
    return 'Other';
};

// FINAL SOLUTION: This MUST be "export default" to fix your App.jsx error
export default function ManageOffers() {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [showAddOfferModal, setShowAddOfferModal] = useState(false);
    const [editingOfferId, setEditingOfferId] = useState(null);
    const [offerSearch, setOfferSearch] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [selectedPdfFile, setSelectedPdfFile] = useState(null);

    const [newOffer, setNewOffer] = useState({
        company: '',
        position: '',
        country: '',
        stipend: '',
        duration: '',
        field: '',
        deadline: '',
        description: '',
        requirements: '',
    });

    const handlePdfChange = async (e) => {
        const file = e.target.files?.[0] || null;
        setSelectedPdfFile(file);

        if (file) {
            const confirmAutoFill = window.confirm("Extract data from this PDF to auto-fill the form?");
            if (!confirmAutoFill) return;

            setIsExtracting(true);
            const formData = new FormData();
            formData.append('offerPdf', file);

            try {
                const response = await axios.post(`${API_BASE_URL}/api/offers/extract`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                // Mapping extracted data from source [cite: 4, 14, 24, 33, 38]
                const { offer_id, company, stipend, domain, tasks } = response.data.data;

                setNewOffer(prev => ({
                    ...prev,
                    position: offer_id || prev.position, // e.g., ES-2026-1700 
                    company: company || prev.company,     // e.g., Originaltec 
                    stipend: stipend || prev.stipend,     // e.g., 800 EUR 
                    field: Array.isArray(domain) ? domain.join(', ') : (domain || prev.field), // [cite: 33]
                    description: Array.isArray(tasks) ? tasks.join('\n') : (tasks || prev.description) // [cite: 38]
                }));

                alert("Data extracted successfully!");
            } catch (err) {
                console.error("Extraction failed:", err);
                alert("Could not extract data. Please fill manually.");
            } finally {
                setIsExtracting(false);
            }
        }
    };

    const loadOffers = () => {
        apiFetch('/api/admin/offers')
            .then((r) => setOffers(r.offers || []))
            .catch((err) => {
                if (err?.status === 403) {
                    clearAuthSession();
                    navigate('/login');
                }
            });
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const handleAddOffer = async (e) => {
        e.preventDefault();
        try {
            let offerId = editingOfferId;
            if (editingOfferId) {
                await apiFetch(`/api/admin/offers/${editingOfferId}`, { method: 'PATCH', body: newOffer });
            } else {
                const res = await apiFetch('/api/admin/offers', { method: 'POST', body: newOffer });
                offerId = res?.offer?._id || res?.offer?.id;
            }
            
            if (selectedPdfFile && offerId) {
                await apiUploadOfferPdf(offerId, selectedPdfFile);
            }
            
            loadOffers();
            setShowAddOfferModal(false);
            setEditingOfferId(null);
        } catch (err) {
            alert(err?.message || 'Failed to save offer');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Offer Management</h3>
                <button 
                    onClick={() => { setEditingOfferId(null); setShowAddOfferModal(true); }}
                    className="bg-[#0B3D59] text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <AddIcon className="mr-2" /> Add Offer
                </button>
            </div>

            {/* Modal */}
            {showAddOfferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold">{editingOfferId ? 'Edit' : 'New'} Offer</h2>
                            <button onClick={() => setShowAddOfferModal(false)}><CancelIcon /></button>
                        </div>

                        <form onSubmit={handleAddOffer} className="space-y-4">
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                onChange={handlePdfChange} 
                                className="w-full border p-2 rounded"
                            />
                            {isExtracting && <p className="text-blue-600 animate-pulse">Extracting data...</p>}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Company" value={newOffer.company} onChange={e => setNewOffer({...newOffer, company: e.target.value})} className="border p-2 rounded" required />
                                <input placeholder="Position/ID" value={newOffer.position} onChange={e => setNewOffer({...newOffer, position: e.target.value})} className="border p-2 rounded" required />
                                <input placeholder="Stipend" value={newOffer.stipend} onChange={e => setNewOffer({...newOffer, stipend: e.target.value})} className="border p-2 rounded" />
                                <input placeholder="Field" value={newOffer.field} onChange={e => setNewOffer({...newOffer, field: e.target.value})} className="border p-2 rounded" />
                            </div>

                            <textarea 
                                placeholder="Description" 
                                rows="5" 
                                value={newOffer.description} 
                                onChange={e => setNewOffer({...newOffer, description: e.target.value})} 
                                className="w-full border p-2 rounded"
                            />

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddOfferModal(false)} className="px-4 py-2">Cancel</button>
                                <button type="submit" disabled={isExtracting} className="bg-[#0B3D59] text-white px-6 py-2 rounded">
                                    {editingOfferId ? 'Update' : 'Publish'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}