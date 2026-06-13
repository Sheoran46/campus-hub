import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function ItemDetails() {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [item, setItem] = useState(null);
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchItemDetails = async () => {
            try {
                const response = await api.get(`/items/${itemId}`);
                setItem(response.data);

                // EVERYONE can now fetch the claims for a FOUND item to see the public status
                if (response.data.type === 'FOUND') {
                    const claimsResponse = await api.get(`/claims/item/${itemId}`);
                    setClaims(claimsResponse.data);
                }
            } catch (err) {
                console.error("Failed to fetch item details", err);
                setError("Item not found or an error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchItemDetails();
    }, [itemId, user]);

    const handleMessageUser = (email, name) => {
        navigate('/chat', {
            state: { contactEmail: email, contactName: name, context: { type: 'item', id: item.itemId } }
        });
    };

    const handleDeleteItem = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this report?")) return;

        try {
            await api.delete(`/items/${itemId}`);
            alert("Item report deleted successfully.");
            navigate('/feed'); // Redirect back to feed after deletion
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert("Could not delete item. You might not have permission.");
        }
    };

    // Founder handling claims
    const handleClaimAction = async (claimId, action) => {
        try {
            await api.patch(`/claims/${claimId}/${action}`);
            alert(`Claim ${action} successfully!`);
            // Refresh claims
            const claimsResponse = await api.get(`/claims/item/${itemId}`);
            setClaims(claimsResponse.data);

            // If approved, refresh item to see RESOLVED status
            if (action === 'approve') {
                const itemResponse = await api.get(`/items/${itemId}`);
                setItem(itemResponse.data);
            }
        } catch (error) {
            console.error(`Failed to ${action} claim:`, error);
            alert(`Failed to ${action} claim: ` + (error.response?.data || error.message));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-white rounded-3xl shadow-sm border border-cyan-100 mt-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{error || "Item not found"}</h2>
                <button onClick={() => navigate(-1)} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2.5 rounded-full font-medium shadow-md hover:from-cyan-600 hover:to-blue-600 transition-all">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button onClick={() => navigate(-1)} className="flex items-center text-sm font-semibold text-slate-500 hover:text-cyan-600 mb-8 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Feed
            </button>

            <div className="bg-white rounded-3xl shadow-lg shadow-cyan-900/5 border border-cyan-100 overflow-hidden flex flex-col lg:flex-row">

                {/* Image Gallery Side */}
                <div className="lg:w-1/2 bg-slate-50 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                        <>
                            <div className="h-[400px] lg:h-[550px] w-full">
                                <img
                                    src={item.imageUrls[0]}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Thumbnails if multiple images exist */}
                            {item.imageUrls.length > 1 && (
                                <div className="flex p-4 gap-3 overflow-x-auto bg-white border-t border-slate-100">
                                    {item.imageUrls.map((url, idx) => (
                                        <img key={idx} src={url} alt={`${item.title} thumbnail ${idx}`} className="h-20 w-20 object-cover rounded-xl cursor-pointer border-2 border-transparent hover:border-cyan-500 transition-all shadow-sm" />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-[400px] lg:h-[550px] flex items-center justify-center text-slate-400 bg-slate-50">
                            <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">No images available</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Side */}
                <div className="lg:w-1/2 flex flex-col bg-white">
                    <div className="p-8 lg:p-10 flex-grow">
                        <div className="flex justify-between items-start mb-6">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                                item.type === 'LOST' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {item.type} ITEM
                            </span>
                            <span className="text-sm text-slate-500 font-medium">
                                {new Date(item.dateReported).toLocaleDateString()}
                            </span>
                        </div>

                        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">{item.title}</h1>

                        <div className="flex items-center text-slate-600 mb-8 bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-semibold text-slate-800">{item.location}</span>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">{item.description}</p>
                        </div>
                    </div>

                    {/* Reporter Details */}
                    <div className="border-t border-slate-100 bg-slate-50 p-6 lg:p-8 mt-auto">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Reported By</h3>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {item.reporterName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{item.reporterName}</p>
                                    <p className="text-xs text-slate-500">Campus Member</p>
                                </div>
                            </div>

                            {/* Action Buttons based on context */}
                            {user && user.email !== item.reporterEmail ? (
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => handleMessageUser(item.reporterEmail, item.reporterName)}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:text-cyan-600 transition-colors shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                        </svg>
                                        Message
                                    </button>

                                    {item.type === 'FOUND' && item.status === 'OPEN' && (
                                        <Link
                                            to={`/claim/${item.itemId}`} state={{ item: item }}
                                            className="flex-1 sm:flex-none flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md"
                                        >
                                            Claim Item
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <span className="flex-1 sm:flex-none flex items-center justify-center text-xs font-bold text-cyan-700 bg-cyan-100 px-4 py-2.5 rounded-full border border-cyan-200">
                                        This is your report
                                    </span>
                                    {/* DELETE BUTTON ADDED HERE */}
                                    <button
                                        onClick={handleDeleteItem}
                                        className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-semibold hover:bg-rose-100 transition-colors shadow-sm"
                                        title="Delete Report"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Claims Section (Visible to EVERYONE if it's a FOUND item) */}
            {item.type === 'FOUND' && claims.length > 0 && (
                <div className="mt-12 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900">Public Claims for this item ({claims.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {claims.map(claim => (
                            <div key={claim.claimId} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-slate-900">{claim.claimerName}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            claim.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                            claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                            {claim.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 mt-3">Proof Provided</p>
                                    <p className="text-slate-700 text-sm bg-white p-3 rounded-lg border border-slate-100">{claim.proofDescription}</p>
                                </div>

                                {/* Founder Action Buttons OR Contact Button */}
                                <div className="flex-shrink-0 w-full md:w-auto flex gap-2">
                                    {/* If I am the founder, I can approve/reject and message */}
                                    {user && item.reporterEmail === user.email ? (
                                        <>
                                            <button
                                                onClick={() => handleMessageUser(claim.claimerEmail, claim.claimerName)}
                                                className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 border border-blue-200 rounded-lg shadow-sm text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                title="Message Claimer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                            </button>

                                            {claim.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleClaimAction(claim.claimId, 'approve')}
                                                        className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if(window.confirm("Are you sure you want to reject this claim?")) {
                                                                handleClaimAction(claim.claimId, 'reject');
                                                            }
                                                        }}
                                                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg shadow-sm transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}