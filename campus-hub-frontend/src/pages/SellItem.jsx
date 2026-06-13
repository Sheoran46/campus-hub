import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function SellItem() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        askingPrice: '',
        quantity: 1
    });
    const [images, setImages] = useState(null);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    useEffect(() => {
        // Preload Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => setRazorpayLoaded(true);
        script.onerror = () => {
            console.error("Failed to load Razorpay script");
            setRazorpayLoaded(false);
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setImages(e.target.files);
    };

    const handlePaymentAndSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.askingPrice) {
            alert("Please fill all required fields");
            return;
        }

        if (!razorpayLoaded) {
            alert("Razorpay SDK is not loaded yet. Please check your internet connection and try again.");
            return;
        }

        setLoading(true);
        setPaymentStatus('processing');

        try {
            // 1. Fetch Razorpay Key ID from backend
            const keyRes = await api.get('/payments/key');
            const razorpayKeyId = keyRes.data.keyId;

            // 2. Create order on backend
            const orderRes = await api.post('/payments/create-order');

            let order;
            if (typeof orderRes.data === 'string') {
                order = JSON.parse(orderRes.data);
            } else if (orderRes.data && typeof orderRes.data === 'object' && orderRes.data.id) {
                 order = orderRes.data;
            } else {
                 throw new Error("Unexpected response format from create-order");
            }

            const options = {
                key: razorpayKeyId,
                amount: order.amount,
                currency: order.currency,
                name: "Campus Hub",
                description: "Marketplace Listing Fee",
                order_id: order.id,
                handler: async function (response) {
                    await submitItemToBackend(response);
                },
                prefill: {
                    name: "Student",
                    email: "student@campushub.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#0891b2" // cyan-600
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                        setPaymentStatus('idle');
                    }
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', function (response){
                 alert("Payment Failed: " + response.error.description);
                 setLoading(false);
                 setPaymentStatus('idle');
            });
            paymentObject.open();

        } catch (error) {
            console.error("Payment initiation failed:", error);
            const errorMsg = error.response && error.response.data ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)) : "Could not initiate payment. Check console for details.";
            alert(errorMsg);
            setLoading(false);
            setPaymentStatus('idle');
        }
    };

    const submitItemToBackend = async (razorpayResponse) => {
        setPaymentStatus('success');

        const data = new FormData();

        const payload = {
            ...formData,
            askingPrice: parseFloat(formData.askingPrice),
            quantity: parseInt(formData.quantity),
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature
        };

        data.append("itemData", JSON.stringify(payload));

        if (images) {
            for (let i = 0; i < images.length; i++) {
                data.append("images", images[i]);
            }
        }

        try {
            await api.post('/marketplace', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate('/marketplace');
        } catch (error) {
            console.error("Failed to post item for sale:", error);
            alert("Payment was successful, but failed to save item. Contact support.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="mb-8 text-center sm:text-left flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sell an Item</h1>
                    <p className="mt-2 text-slate-500 font-medium">List your textbook, electronics, or gear.</p>
                </div>
                <Link to="/marketplace" className="hidden sm:flex text-sm font-semibold text-slate-500 hover:text-cyan-600 transition-colors">
                    Back to Marketplace
                </Link>
            </div>

            <form onSubmit={handlePaymentAndSubmit} className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-lg shadow-cyan-900/5 border border-cyan-100 space-y-6">

                {/* Information Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-cyan-100 rounded-2xl p-5 flex items-start space-x-4 shadow-sm">
                    <div className="bg-white p-2 rounded-full shadow-sm flex-shrink-0">
                        <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Listing Fee Required</h4>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                            To maintain the quality of our marketplace and prevent spam, a nominal, non-refundable fee of <span className="font-extrabold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-md mx-0.5">₹10</span> is required to list an item.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">What are you selling?</label>
                    <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Casio Scientific Calculator fx-991EX"
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-sm"
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Asking Price (₹)</label>
                        <div className="relative shadow-sm rounded-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-400 font-bold">₹</span>
                            </div>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                name="askingPrice"
                                required
                                value={formData.askingPrice}
                                onChange={handleChange}
                                placeholder="800"
                                className="block w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div className="w-1/3">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            name="quantity"
                            required
                            value={formData.quantity}
                            onChange={handleChange}
                            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-sm"
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-500 flex items-center font-medium">
                    <span className="flex h-4 w-4 bg-emerald-100 rounded-full items-center justify-center mr-1.5">
                        <svg className="w-2.5 h-2.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    Our AI will automatically appraise this price for buyers to build trust.
                </p>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                    <textarea
                        name="description"
                        required
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Mention how old it is, condition, and why you are selling it..."
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none shadow-sm"
                    ></textarea>
                </div>

                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-3">Photos (Highly Recommended)</label>
                    <div className="flex justify-center px-6 pt-6 pb-8 border-2 border-cyan-200 border-dashed rounded-xl hover:bg-cyan-50/50 transition-colors bg-white">
                        <div className="space-y-2 text-center">
                            <div className="mx-auto h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center mb-3">
                                <svg className="h-6 w-6 text-cyan-600" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="flex text-sm text-slate-600 justify-center">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
                                    <span>Upload files</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1 font-medium">or drag and drop</p>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">PNG, JPG, GIF up to 5MB</p>
                            {images && (
                                <div className="inline-block bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mt-3">
                                    <p className="text-xs text-emerald-700 font-bold">{images.length} file(s) selected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/marketplace')}
                        className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full hover:from-cyan-600 hover:to-blue-600 disabled:opacity-70 disabled:cursor-wait transition-all shadow-md hover:shadow-lg flex items-center justify-center order-1 sm:order-2 min-w-[200px]"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {paymentStatus === 'processing' ? 'Connecting to Razorpay...' : 'Saving...'}
                            </>
                        ) : 'Pay ₹10 & List Item'}
                    </button>
                </div>
            </form>
        </div>
    );
}