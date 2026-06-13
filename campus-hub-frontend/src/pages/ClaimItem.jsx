import { useState, useContext } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function ClaimItem() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);

    // Retrieve the item data passed from the Feed page
    const item = location.state?.item;

    const [proofDescription, setProofDescription] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Protect the route
    if (!item) {
        return <Navigate to="/feed" />;
    }

    // Check if user is trying to claim their own item (shouldn't happen via UI, but good safety check)
    if (user && item.reporterEmail === user.email) {
        return (
             <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                 <h1 className="text-2xl font-bold text-slate-900 mb-4">You cannot claim an item you reported.</h1>
                 <button onClick={() => navigate('/feed')} className="text-cyan-600 font-medium hover:underline">Return to Feed</button>
             </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/claims', {
                itemId: item.itemId,
                proofDescription: proofDescription,
                phone: phone
            });
            // Show success message and redirect
            alert("Your claim has been submitted successfully! The person who found the item will contact you.");
            navigate('/feed');
        } catch (err) {
            console.error("Failed to submit claim", err);
            // Catch 403 specifically to show penalty messages
            if (err.response?.status === 403) {
                 setError(err.response?.data || "You are blocked from claiming items.");
            } else {
                 setError(err.response?.data?.message || err.response?.data?.error || "You have already claimed this item or an error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Claim Found Item</h1>
            <p className="text-slate-500 font-medium mb-8">Provide specific details to prove this item belongs to you.</p>

            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg shadow-cyan-900/5 border border-cyan-100">
                {/* Item Summary Box */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-5 rounded-2xl border border-cyan-100 mb-8 flex gap-4 items-center">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                        <img src={item.imageUrls[0]} alt="Item" className="w-20 h-20 object-cover rounded-xl shadow-sm" />
                    ) : (
                        <div className="w-20 h-20 bg-white border border-cyan-200 rounded-xl flex items-center justify-center text-3xl shadow-sm">📦</div>
                    )}
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                        <p className="text-sm font-medium text-cyan-700 flex items-center mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Found at: {item.location}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="text-sm font-medium text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-200 flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            Your Contact Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 9876543210"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            Proof of Ownership <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-xs font-medium text-slate-500 mb-3">
                            Describe specific scratches, serial numbers, what was inside it, or the exact date/time you lost it. The finder will review this claim.
                        </p>
                        <textarea
                            required
                            rows="5"
                            value={proofDescription}
                            onChange={(e) => setProofDescription(e.target.value)}
                            placeholder="e.g., The water bottle has a small dent on the bottom and a sticker of a cat..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-sm resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm order-2 sm:order-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-md hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all flex items-center justify-center order-1 sm:order-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : 'Submit Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}