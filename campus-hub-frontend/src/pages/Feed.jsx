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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-12 border-b border-cyan-200/50 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Campus Feed</h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Lost something? Found something? Connect here.</p>
                </div>
                <div className="flex w-full md:w-auto items-center space-x-4">
                    <form onSubmit={handleSearch} className="flex-1 md:w-80 relative shadow-sm">
                        <input
                            type="text"
                            placeholder="Search lost and found..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-5 pr-12 py-3 bg-white border border-cyan-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium placeholder-slate-400"
                        />
                        <button type="submit" className="absolute right-1 top-1 h-[calc(100%-8px)] px-4 rounded-full text-white bg-cyan-600 hover:bg-cyan-700 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    </form>
                </div>
            </div>

            {/* Rounded Tabs */}
            <div className="flex bg-white/50 backdrop-blur-sm border border-cyan-100 p-1 rounded-xl inline-flex shadow-sm mb-8">
                <button
                    onClick={() => setType('LOST')}
                    className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        type === 'LOST'
                        ? 'bg-white text-rose-600 shadow shadow-cyan-100'
                        : 'text-slate-500 hover:text-rose-500'
                    }`}
                >
                    Lost Items
                </button>
                <button
                    onClick={() => setType('FOUND')}
                    className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        type === 'FOUND'
                        ? 'bg-white text-teal-600 shadow shadow-cyan-100'
                        : 'text-slate-500 hover:text-teal-500'
                    }`}
                >
                    Found Items
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 bg-white/60 backdrop-blur-sm border border-cyan-100 rounded-3xl shadow-sm">
                    <svg className="mx-auto h-12 w-12 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="mt-4 text-slate-500 font-medium text-lg">No {type.toLowerCase()} items currently reported.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {items.map(item => (
                        <div
                            key={item.itemId}
                            onClick={() => navigate(`/item/${item.itemId}`)}
                            className="bg-white border border-cyan-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-cyan-900/10 cursor-pointer transition-all duration-300 flex flex-col group hover:-translate-y-1"
                        >
                            <div className="relative h-56 border-b border-cyan-50 overflow-hidden bg-slate-50">
                                {item.imageUrls && item.imageUrls.length > 0 ? (
                                    <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-medium text-slate-400">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${item.type === 'LOST' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {item.type}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col h-full">
                                <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-2 tracking-tight group-hover:text-cyan-700 transition-colors">{item.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow">{item.description}</p>

                                <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-auto">
                                    <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                                        <span className="truncate pr-4 text-cyan-700">📍 {item.location}</span>
                                        <span className="flex-shrink-0">{new Date(item.dateReported).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}