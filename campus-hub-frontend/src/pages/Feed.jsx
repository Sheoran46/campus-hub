import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Feed() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('LOST');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchItems(); }, [type]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/items?type=${type}&status=OPEN`);
            setItems(response.data.content);
        } catch (error) {
            console.error("Failed to fetch items:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return fetchItems();
        try {
            setLoading(true);
            const response = await api.get(`/items/search?keyword=${searchQuery}`);
            setItems(response.data.content);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12 border-b border-cyan-200/50 pb-4 md:pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Campus Feed</h1>
                    <p className="text-sm text-slate-500 mt-1 md:mt-2 font-medium">Lost something? Found something? Connect here.</p>
                </div>

                {/* Search Bar for Mobile/Desktop */}
                <div className="flex w-full md:w-auto items-center space-x-4 mt-4 md:mt-0">
                    <form onSubmit={handleSearch} className="flex-1 md:w-80 relative shadow-sm">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 md:pl-5 pr-12 py-2.5 md:py-3 bg-white border border-cyan-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium placeholder-slate-400"
                        />
                        <button type="submit" className="absolute right-1 top-1 h-[calc(100%-8px)] px-4 rounded-full text-white bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    </form>
                </div>
            </div>

            {/* Rounded Tabs - Mobile Optimized */}
            <div className="flex bg-white/50 backdrop-blur-sm border border-cyan-100 p-1 rounded-xl shadow-sm mb-6 md:mb-8 overflow-x-auto snap-x">
                <button
                    onClick={() => setType('LOST')}
                    className={`flex-1 min-w-[120px] snap-center px-4 md:px-8 py-2 md:py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        type === 'LOST'
                        ? 'bg-white text-rose-600 shadow shadow-cyan-100'
                        : 'text-slate-500 hover:text-rose-500'
                    }`}
                >
                    Lost Items
                </button>
                <button
                    onClick={() => setType('FOUND')}
                    className={`flex-1 min-w-[120px] snap-center px-4 md:px-8 py-2 md:py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        type === 'FOUND'
                        ? 'bg-white text-teal-600 shadow shadow-cyan-100'
                        : 'text-slate-500 hover:text-teal-500'
                    }`}
                >
                    Found Items
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 md:py-32">
                    <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-cyan-600"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 md:py-20 bg-white/60 backdrop-blur-sm border border-cyan-100 rounded-3xl shadow-sm mx-2 md:mx-0">
                    <svg className="mx-auto h-10 w-10 md:h-12 md:w-12 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="mt-3 md:mt-4 text-slate-500 font-medium text-base md:text-lg">No {type.toLowerCase()} items currently reported.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    {items.map(item => (
                        <div
                            key={item.itemId}
                            onClick={() => navigate(`/item/${item.itemId}`)}
                            className="bg-white border border-cyan-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-900/10 cursor-pointer transition-all duration-300 flex flex-col group hover:-translate-y-1"
                        >
                            <div className="relative h-48 md:h-56 border-b border-cyan-50 overflow-hidden bg-slate-50">
                                {item.imageUrls && item.imageUrls.length > 0 ? (
                                    <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-medium text-slate-400 text-sm">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 md:top-4 md:left-4">
                                    <span className={`px-2.5 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold rounded-full shadow-sm ${item.type === 'LOST' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {item.type}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 md:p-6 flex flex-col h-full">
                                <h3 className="font-bold text-base md:text-lg text-slate-900 line-clamp-1 mb-1 md:mb-2 tracking-tight group-hover:text-cyan-700 transition-colors">{item.title}</h3>
                                <p className="text-xs md:text-sm text-slate-500 line-clamp-2 mb-4 md:mb-6 flex-grow">{item.description}</p>

                                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 md:pt-4 mt-auto">
                                    <div className="flex justify-between items-center text-[10px] md:text-xs font-medium text-slate-400">
                                        <span className="truncate pr-2 md:pr-4 text-cyan-700">📍 {item.location}</span>
                                        <span className="flex-shrink-0">{new Date(item.dateReported).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Action Button for Mobile */}
            <Link
                to="/report"
                className="md:hidden fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </Link>
        </div>
    );
}