import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ReportItem() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [type, setType] = useState('LOST');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: ''
    });
    const [images, setImages] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setImages(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();

            const payload = {
                title: formData.title,
                description: formData.description,
                location: formData.location,
                type: type
            };

            // Send it as a JSON string
            data.append("itemData", JSON.stringify(payload));

            if (images) {
                for (let i = 0; i < images.length; i++) {
                    data.append("images", images[i]);
                }
            }

            await api.post('/items', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            navigate('/feed');
        } catch (error) {
            console.error("Failed to report item:", error);
            alert("Failed to upload. If testing offline, ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Report an Item</h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">Did you lose something, or find something that belongs to someone else?</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-lg shadow-cyan-900/5 border border-cyan-100 space-y-6">

                {/* Custom Toggle Switch for LOST vs FOUND */}
                <div className="flex bg-slate-50 p-1.5 rounded-2xl shadow-inner border border-slate-100">
                    <button
                        type="button"
                        onClick={() => setType('LOST')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'LOST' ? 'bg-white text-rose-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-rose-500 hover:bg-slate-100/50'}`}
                    >
                        I Lost Something
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('FOUND')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'FOUND' ? 'bg-white text-teal-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-teal-500 hover:bg-slate-100/50'}`}
                    >
                        I Found Something
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Name</label>
                    <input
                        type="text" name="title" required value={formData.title} onChange={handleChange}
                        placeholder={type === 'LOST' ? "e.g., Black Leather Wallet" : "e.g., Casio Calculator"}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Location</label>
                    <input
                        type="text" name="location" required value={formData.location} onChange={handleChange}
                        placeholder={type === 'LOST' ? "Where did you last see it?" : "Where did you find it?"}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                    <textarea
                        name="description" required rows="4" value={formData.description} onChange={handleChange}
                        placeholder="Provide details like color, brand, or unique scratches..."
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                    ></textarea>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-5 rounded-2xl border border-cyan-100">
                    <label className="block text-sm font-bold text-cyan-900 mb-3">Upload Photos (Required)</label>

                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-cyan-300 border-dashed rounded-xl cursor-pointer bg-white/50 hover:bg-white transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-3 text-cyan-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-1 text-sm text-slate-500"><span className="font-bold text-cyan-600">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-slate-400">SVG, PNG, JPG or GIF</p>
                            </div>
                            <input type="file" multiple accept="image/*" required onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                    {images && (
                        <div className="mt-3 flex items-center justify-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                {images.length} file(s) selected
                            </span>
                        </div>
                    )}
                </div>

                <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                    <button
                        type="button" onClick={() => navigate('/feed')}
                        className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-full shadow-sm transition-all order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit" disabled={loading}
                        className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-md hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all order-1 sm:order-2 flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : 'Submit Report'}
                    </button>
                </div>
            </form>
        </div>
    );
}