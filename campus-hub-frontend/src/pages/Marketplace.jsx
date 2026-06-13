import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Marketplace() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Modal state for buy request
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [selectedItemForBuy, setSelectedItemForBuy] = useState(null);
    const [buyFormData, setBuyFormData] = useState({ phone: '', extraDetails: '' });
    const [buySubmitting, setBuySubmitting] = useState(false);

    useEffect(() => {
        fetchMarketItems();
    }, []);

    const fetchMarketItems = async () => {
        try {
            setLoading(true);
            const response = await api.get('/marketplace');
            setItems(response.data.content);
        } catch (error) {
            console.error("Failed to fetch marketplace items:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchMarketItems();
            return;
        }
        try {
            setLoading(true);
            const response = await api.get(`/marketplace/search?keyword=${searchQuery}`);
            setItems(response.data.content);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsSold = async (marketId) => {
        try {
            await api.patch(`/marketplace/${marketId}/sold`);
            setItems(items.filter(item => item.marketId !== marketId));
        } catch (error) {
            console.error("Failed to update item status:", error);
            alert("Could not mark item as sold.");
        }
    };

    const handleDeleteItem = async (marketId) => {
        if (!window.confirm("Are you sure you want to delete this listing permanently?")) return;

        try {
            await api.delete(`/marketplace/${marketId}`);
            setItems(items.filter(item => item.marketId !== marketId));
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert("Could not delete item. You might not have permission.");
        }
    };

    const startChat = (sellerEmail, sellerName, marketId) => {
        navigate('/chat', {
            state: {
                contactEmail: sellerEmail,
                contactName: sellerName,
                context: { type: 'market', id: marketId }
            }
        });
    };

    const openBuyModal = (item) => {
        setSelectedItemForBuy(item);
        setBuyFormData({ phone: '', extraDetails: '' });
        setIsBuyModalOpen(true);
    };

    const closeBuyModal = () => {
        setIsBuyModalOpen(false);
        setSelectedItemForBuy(null);
    };

    const handleBuySubmit = async (e) => {
        e.preventDefault();
        setBuySubmitting(true);
        try {
            await api.post(`/marketplace/${selectedItemForBuy.marketId}/buy`, buyFormData);
            alert("Your request has been sent to the seller!");
            closeBuyModal();
        } catch (error) {
            console.error("Failed to send buy request:", error);
            alert("Failed to send request. Please try again later.");
        } finally {
            setBuySubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-12 border-b border-cyan-200/50 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Student Marketplace</h1>
                    <p className="mt-1 text-sm text-slate-500 font-medium">Buy and sell items securely within your campus network.</p>
                </div>

                <div className="flex w-full md:w-auto items-center space-x-4">
                    <form onSubmit={handleSearch} className="flex-1 md:w-80 relative shadow-sm">
                        <input
                            type="text"
                            placeholder="Search textbooks, tech..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-5 pr-12 py-3 bg-white border border-cyan-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium placeholder-slate-400"
                        />
                        <button type="submit" className="absolute right-1 top-1 h-[calc(100%-8px)] px-4 rounded-full text-white bg-cyan-600 hover:bg-cyan-700 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </form>

                    <Link
                        to="/sell"
                        className="flex-shrink-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-md hover:from-cyan-600 hover:to-blue-600 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        + Sell Item
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 bg-white/60 backdrop-blur-sm border border-cyan-100 rounded-3xl shadow-sm">
                    <svg className="mx-auto h-12 w-12 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="mt-4 text-slate-500 font-medium text-lg">No items found.</p>
                    <p className="text-sm text-slate-400 mt-1">Try a different search or list an item yourself.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {items.map(item => (
                        <div key={item.marketId} className="bg-white border border-cyan-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-900/10 transition-all duration-300 flex flex-col group hover:-translate-y-1">

                            {/* Image Container */}
                            <div className="relative h-48 overflow-hidden bg-slate-50 border-b border-cyan-50">
                                {item.imageUrls && item.imageUrls.length > 0 ? (
                                    <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-medium text-slate-400">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-cyan-100 px-3 py-1.5 rounded-full shadow-sm">
                                    <span className="text-sm font-extrabold text-cyan-800">₹{item.askingPrice}</span>
                                </div>
                                {item.quantity !== null && (
                                    <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                                        Qty: {item.quantity}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 flex-grow flex flex-col">
                                <h3 className="font-bold text-slate-900 text-lg line-clamp-1 mb-2 group-hover:text-cyan-700 transition-colors">{item.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow">{item.description}</p>

                                {/* AI Analysis Tag */}
                                {item.aiProfitAnalysis ? (
                                    <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 relative overflow-hidden">
                                        <div className="absolute -right-2 -top-2 opacity-10">
                                            <svg className="w-12 h-12 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm0-8a3 3 0 100 6 3 3 0 000-6zm4.243-1.757a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.061-1.06a.75.75 0 010-1.061zM4.757 14.183a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.061-1.06a.75.75 0 010-1.061zM15.5 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm12.243 4.183a.75.75 0 010 1.06l-1.061 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM4.757 5.817a.75.75 0 010-1.06l1.061-1.06a.75.75 0 011.06 1.06l-1.061 1.06a.75.75 0 01-1.06 0z"/></svg>
                                        </div>
                                        <p className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase mb-1">AI Valuation</p>
                                        <p className="text-xs text-indigo-900 font-medium leading-relaxed mb-2 relative z-10">{item.aiProfitAnalysis}</p>
                                        <span className="inline-block bg-white text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border border-indigo-50">Est. Retail: ₹{item.aiNewPriceEstimate}</span>
                                    </div>
                                ) : (
                                    <div className="mb-6 bg-slate-50 rounded-xl p-3 flex items-center justify-center border border-slate-100 border-dashed">
                                        <span className="text-xs font-medium text-slate-400 flex items-center">
                                            <span className="animate-pulse mr-2 h-1.5 w-1.5 bg-blue-400 rounded-full"></span>
                                            AI appraising value...
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-col border-t border-slate-100 mt-auto pt-4 space-y-3">
                                    <div className="flex items-center space-x-2 truncate">
                                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 border border-cyan-200 flex flex-shrink-0 items-center justify-center text-xs font-bold text-cyan-700">
                                            {item.sellerName.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600 truncate">{item.sellerName.split(' ')[0]}</span>
                                    </div>

                                    {user && user.email === item.sellerEmail ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleMarkAsSold(item.marketId)}
                                                className="flex-1 text-xs font-bold bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
                                            >
                                                Mark Sold
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.marketId)}
                                                className="flex-shrink-0 text-xs font-bold bg-rose-50 text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100"
                                                title="Delete Listing"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startChat(item.sellerEmail, item.sellerName, item.marketId)}
                                                className="flex-1 text-xs font-bold bg-cyan-50 text-cyan-700 px-3 py-2 rounded-lg hover:bg-cyan-100 transition-colors flex items-center justify-center border border-cyan-100 shadow-sm"
                                                title="Chat with Seller"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => openBuyModal(item)}
                                                className="flex-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-colors shadow-sm"
                                            >
                                                Request to Buy
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Buy Request Modal */}
            {isBuyModalOpen && selectedItemForBuy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Request to Buy</h2>
                            <p className="text-sm text-slate-500 mt-1">Send your details to the seller of "{selectedItemForBuy.title}"</p>
                        </div>
                        <form onSubmit={handleBuySubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Your Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={buyFormData.phone}
                                    onChange={(e) => setBuyFormData({...buyFormData, phone: e.target.value})}
                                    placeholder="e.g. 9876543210"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Additional Message (Optional)</label>
                                <textarea
                                    rows="3"
                                    value={buyFormData.extraDetails}
                                    onChange={(e) => setBuyFormData({...buyFormData, extraDetails: e.target.value})}
                                    placeholder="Any questions or negotiation..."
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                ></textarea>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeBuyModal}
                                    className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={buySubmitting}
                                    className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                >
                                    {buySubmitting ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}