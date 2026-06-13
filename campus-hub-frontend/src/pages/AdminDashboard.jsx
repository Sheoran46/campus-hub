import { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const [pendingClaims, setPendingClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchPendingClaims();
        }
    }, [user]);

    const fetchPendingClaims = async () => {
        try {
            const response = await api.get('/admin/claims/pending');
            setPendingClaims(response.data);
        } catch (error) {
            console.error("Failed to fetch claims:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimAction = async (claimId, action) => {
        try {
            await api.patch(`/admin/claims/${claimId}/review?status=${action}`);
            alert(`Claim successfully marked as ${action}`);
            setPendingClaims(prev => prev.filter(c => c.claimId !== claimId));
        } catch (error) {
            alert("Failed to process claim: " + (error.response?.data || error.message));
        }
    };

    // Security check: Only allow ADMIN
    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/feed" />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-12 border-b border-cyan-200/50 pb-6">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">Review pending claims and manage user penalties.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900">Pending Claim Reviews</h2>
                        <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-3 py-1 rounded-full">{pendingClaims.length} awaiting review</span>
                    </div>

                    {pendingClaims.length === 0 ? (
                        <div className="p-16 text-center text-slate-500 font-medium">
                            <svg className="mx-auto h-12 w-12 text-emerald-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>You're all caught up! No pending claims.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {pendingClaims.map(claim => (
                                <div key={claim.claimId} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-lg text-slate-900">Item: {claim.itemTitle}</h3>
                                                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                                    Pending Admin Review
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Claimer Name</p>
                                                    <p className="font-medium text-slate-800">{claim.claimerName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Claimer Email</p>
                                                    <p className="font-medium text-slate-800">{claim.claimerEmail}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Proof Provided</p>
                                                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{claim.proofDescription}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 lg:w-48">
                                            <button
                                                onClick={() => handleClaimAction(claim.claimId, 'APPROVED')}
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors flex justify-center items-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Approve Claim
                                            </button>

                                            <button
                                                onClick={() => handleClaimAction(claim.claimId, 'REJECTED')}
                                                className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg shadow-sm transition-colors"
                                            >
                                                Reject (Safe)
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if(window.confirm("Are you sure this is a fraudulent claim? A strike will be added to the user's account.")) {
                                                        handleClaimAction(claim.claimId, 'FRAUDULENT');
                                                    }
                                                }}
                                                className="w-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center mt-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Mark Fraudulent
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}