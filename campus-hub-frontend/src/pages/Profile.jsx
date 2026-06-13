import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
    const { user } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(null);
    const [myClaims, setMyClaims] = useState([]); // Added state for claims
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // Fetch both profile data and claims at the same time
            const [userRes, claimsRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/claims/my-claims')
            ]);
            setProfileData(userRes.data);
            setMyClaims(claimsRes.data); // Save the claims data
        } catch (err) {
            console.error("Failed to fetch profile", err);
            setError("Could not load profile data.");
        } finally {
            setLoading(false);
        }
    };

    const handlePayFine = async (penaltyId) => {
        try {
            await api.patch(`/users/penalties/${penaltyId}/pay`);
            // Refresh the profile data to show the updated fine balance
            fetchProfile();
        } catch (err) {
            console.error("Failed to pay fine", err);
            alert(err.response?.data?.message || "Could not process payment.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-12 text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-8">My Profile</h1>

            {/* Profile Overview Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-cyan-100 mb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 pb-8 mb-8">
                    <div className="h-24 w-24 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-md">
                        {profileData?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl font-bold text-slate-900">{profileData?.name}</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">{profileData?.email}</p>
                        <span className="inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 uppercase tracking-wider">
                            {profileData?.role}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Unpaid Fines</p>
                        <p className={`text-4xl font-black mt-2 ${profileData?.totalUnpaidFinesRs > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            ₹{profileData?.totalUnpaidFinesRs}
                        </p>
                        {profileData?.totalUnpaidFinesRs > 0 && (
                            <p className="text-xs text-rose-500 font-medium mt-2">
                                You cannot claim items until fines are paid.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Penalty Ledger */}
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Penalty History</h2>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 overflow-hidden mb-12">
                {profileData?.penaltyHistory?.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <svg className="mx-auto h-12 w-12 text-emerald-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium text-lg">No penalties on your record.</p>
                        <p className="text-sm mt-1">Great job being an honest campus member!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {profileData?.penaltyHistory?.map((penalty) => (
                            <li key={penalty.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="text-base font-bold text-slate-900">
                                        Fraudulent Claim Fine
                                    </p>
                                    <p className="text-sm font-medium text-rose-600 mt-1">Amount: ₹{penalty.amount}</p>
                                    <p className="text-xs text-slate-400 mt-2">Issued on: {new Date(penalty.issuedAt).toLocaleDateString()}</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${penalty.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {penalty.status}
                                    </span>

                                    {penalty.status === 'UNPAID' && (
                                        <button
                                            onClick={() => handlePayFine(penalty.id)}
                                            className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto"
                                        >
                                            Pay ₹{penalty.amount}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* My Claims Tracker */}
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-slate-900">My Claim Requests</h2>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-cyan-100 overflow-hidden mb-8">
                {myClaims.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <svg className="mx-auto h-12 w-12 text-cyan-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="font-medium text-lg">You haven't claimed any items yet.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {myClaims.map((claim) => (
                            <li key={claim.claimId} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:bg-slate-50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <p className="text-lg font-bold text-slate-900">
                                            {claim.itemTitle}
                                        </p>
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider
                                            ${claim.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : ''}
                                            ${claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : ''}
                                            ${claim.status === 'REJECTED' || claim.status === 'FRAUDULENT' ? 'bg-rose-100 text-rose-800' : ''}
                                        `}>
                                            {claim.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 mt-3">Proof Provided</p>
                                    <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100 italic">
                                        "{claim.proofDescription}"
                                    </p>
                                    <p className="text-xs font-medium text-slate-400 mt-3">
                                        Submitted on: {new Date(claim.submittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </div>
    );
}